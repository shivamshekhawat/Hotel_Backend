const axios = require('axios');
const { sql } = require('../db');
require('dotenv').config();

class PynBookingService {
  constructor() {
    this.apiKey = process.env.PYNBOOKING_API_KEY;
    this.baseUrl = 'https://api.pynbooking.com';
  }

  // Fetch all check-ins from PynBooking
  async fetchAllCheckIns() {
    try {
      const response = await axios.get(`${this.baseUrl}/reservation/list/`, {
        headers: {
          'Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching check-ins from PynBooking:', error.message);
      throw new Error('Failed to fetch check-ins from PynBooking');
    }
  }

  // Fetch reservation by room number
  async fetchReservationByRoom(roomNumber) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/reservation/roomSearch/`,
        `roomNo=${roomNumber}`,
        {
          headers: {
            'Api-Key': this.apiKey,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching reservation for room ${roomNumber}:`, error.message);
      throw new Error(`Failed to fetch reservation for room ${roomNumber}`);
    }
  }

  // Process and store reservation data
  async processReservation(pynReservation) {
    const transaction = new sql.Transaction();
    await transaction.begin();
    
    try {
      console.log('Processing reservation for room:', pynReservation.roomName);
      
      // 1. Handle Room
      const room = await this.findOrCreateRoom(transaction, {
        room_number: pynReservation.roomName
      });
      
      if (!room || !room.id) {
        throw new Error(`Failed to find or create room: ${pynReservation.roomName}`);
      }
      console.log('Room found/created with ID:', room.id);
  
      // 2. Handle Primary Guest
      const primaryGuest = pynReservation.guests?.[0];
      if (!primaryGuest) {
        throw new Error('No guest information available for reservation');
      }
  
      const guest = await this.findOrCreateGuest(transaction, {
        first_name: this.extractFirstName(primaryGuest.guestName),
        last_name: this.extractLastName(primaryGuest.guestName),
        phone: primaryGuest.guestPhone || null,
        email: primaryGuest.guestEmail || `guest-${primaryGuest.guestId}@example.com`,
        pynbooking_guest_id: primaryGuest.guestId.toString()
      });
  
      if (!guest || !guest.id) {
        throw new Error('Failed to find or create guest');
      }
      console.log('Guest found/created with ID:', guest.id);
  
      // 3. Handle Reservation
      const reservationData = {
        guest_id: guest.id,
        room_id: room.id,
        check_in_time: pynReservation.checkInDate,
        check_out_time: pynReservation.checkOutDate,
        status: pynReservation.status || 'confirmed'
      };
      
      console.log('Creating/updating reservation with data:', reservationData);
      
      const reservation = await this.findOrCreateReservation(transaction, reservationData);
      
      if (!reservation) {
        throw new Error('Failed to create or update reservation');
      }
      
      console.log('Reservation processed successfully:', reservation.id);
      await transaction.commit();
      return reservation;
    } catch (error) {
      await transaction.rollback();
      console.error('Error processing reservation:', error.message);
      throw error;
    }
  }

  // Helper methods
  extractFirstName(fullName) {
    return fullName.split(' ')[0] || '';
  }

  extractLastName(fullName) {
    return fullName.split(' ').slice(1).join(' ') || fullName;
  }

  async findOrCreateRoom(transaction, { room_number }) {
    try {
      const request = new sql.Request(transaction);
      
      // Try to find existing room
      const existing = await request
        .input('room_number', sql.NVarChar, room_number)
        .query('SELECT TOP 1 * FROM Rooms WHERE room_number = @room_number');
      
      if (existing.recordset.length > 0) {
        console.log('Found existing room:', existing.recordset[0].id);
        return existing.recordset[0];
      }
      
      // Create new room with defaults
      const insertRequest = new sql.Request(transaction);
      const result = await insertRequest
        .input('room_number', sql.NVarChar, room_number)
        .query(`
          INSERT INTO Rooms (room_number)
          OUTPUT inserted.*
          VALUES (@room_number)
        `);
      
      if (!result.recordset || result.recordset.length === 0) {
        throw new Error('Failed to create room');
      }
      
      console.log('Created new room with ID:', result.recordset[0].id);
      return result.recordset[0];
    } catch (error) {
      console.error('Error in findOrCreateRoom:', error.message);
      throw error;
    }
  }

  async findOrCreateGuest(transaction, { first_name, last_name, email, phone, pynbooking_guest_id }) {
    try {
      if (!pynbooking_guest_id) {
        throw new Error('PynBooking guest ID is required');
      }

      const request = new sql.Request(transaction);
      
      // Try to find existing guest by PynBooking guest ID
      const existing = await request
        .input('pynbooking_guest_id', sql.NVarChar, pynbooking_guest_id)
        .query('SELECT TOP 1 * FROM Guests WHERE guest_id = @pynbooking_guest_id');
      
      if (existing.recordset.length > 0) {
        console.log('Found existing guest with ID:', existing.recordset[0].guest_id);
        return existing.recordset[0];
      }
      
      // Create new guest using PynBooking guest ID as the ID
      const insertRequest = new sql.Request(transaction);
      const result = await insertRequest
        .input('guest_id', sql.Int, parseInt(pynbooking_guest_id, 10))
        .input('first_name', sql.NVarChar, first_name || 'Unknown')
        .input('last_name', sql.NVarChar, last_name || 'Guest')
        .input('email', sql.NVarChar, email || `guest-${pynbooking_guest_id}@example.com`)
        .input('phone', sql.NVarChar, phone || null)
        .query(`
          INSERT INTO Guests 
            (guest_id, first_name, last_name, email, phone)
          OUTPUT inserted.*
          VALUES 
            (@guest_id, @first_name, @last_name, @email, @phone)
        `);
      
      if (!result.recordset || result.recordset.length === 0) {
        throw new Error('Failed to create guest');
      }
      
      console.log('Created new guest with ID:', result.recordset[0].guest_id);
      return result.recordset[0];
    } catch (error) {
      console.error('Error in findOrCreateGuest:', error.message);
      throw error;
    }
  }

  async findOrCreateReservation(transaction, { guest_id, room_id, check_in_time, check_out_time, status }) {
    try {
      const request = new sql.Request(transaction);
      
      // Check for existing reservation
      const existing = await request
        .input('room_id', sql.Int, room_id)
        .input('check_in_time', sql.DateTime, new Date(check_in_time))
        .query(`
          SELECT TOP 1 * FROM Reservations 
          WHERE room_id = @room_id 
          AND check_in_time = @check_in_time
        `);
      
      if (existing.recordset.length > 0) {
        // Update existing
        const reservation = existing.recordset[0];
        const updateRequest = new sql.Request(transaction);
        await updateRequest
          .input('id', sql.Int, reservation.id)
          .input('guest_id', sql.Int, guest_id)
          .input('check_out_time', sql.DateTime, new Date(check_out_time))
          .input('is_checked_in', sql.Bit, status === 'Confirmata' ? 1 : 0)
          .query(`
            UPDATE Reservations 
            SET guest_id = @guest_id,
                check_out_time = @check_out_time,
                is_checked_in = @is_checked_in
            WHERE id = @id
          `);
        console.log('Updated existing reservation:', reservation.id);
        return { ...reservation, guest_id, check_out_time, is_checked_in: status === 'Confirmata' ? 1 : 0 };
      }
      
      // Create new
      const insertRequest = new sql.Request(transaction);
      const result = await insertRequest
        .input('guest_id', sql.Int, guest_id)
        .input('room_id', sql.Int, room_id)
        .input('check_in_time', sql.DateTime, new Date(check_in_time))
        .input('check_out_time', sql.DateTime, new Date(check_out_time))
        .input('is_checked_in', sql.Bit, status === 'Confirmata' ? 1 : 0)
        .query(`
          INSERT INTO Reservations 
            (guest_id, room_id, check_in_time, check_out_time, is_checked_in)
          OUTPUT inserted.*
          VALUES 
            (@guest_id, @room_id, @check_in_time, @check_out_time, @is_checked_in)
        `);
      
      if (!result.recordset || result.recordset.length === 0) {
        throw new Error('Failed to create reservation');
      }
      
      console.log('Created new reservation with ID:', result.recordset[0].id);
      return result.recordset[0];
    } catch (error) {
      console.error('Error in findOrCreateReservation:', error.message);
      throw error;
    }
  }

  // Sync all reservations from PynBooking
  async syncReservations() {
    try {
      const reservations = await this.fetchAllCheckIns();
      const results = [];
      
      for (const res of reservations) {
        try {
          const result = await this.processReservation(res);
          results.push(result);
        } catch (error) {
          console.error(`Error processing reservation ${res.id}:`, error);
          results.push({ id: res.id, error: error.message });
        }
      }
      
      return { success: true, count: results.length, results };
    } catch (error) {
      console.error('Sync failed:', error);
      throw error;
    }
  }
}

module.exports = new PynBookingService();
