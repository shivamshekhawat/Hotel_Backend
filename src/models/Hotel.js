const { sql, getPool } = require('../../config/database');

class Hotel {
  /**
   * Create a new hotel
   * @param {Object} hotelData - Hotel data
   * @returns {Object} Created hotel
   */
  static async create(hotelData) {
    const pool = await getPool();
    const request = pool.request();

    const {
      Name,
      Logo_url = '',
      Established_year = new Date().getFullYear(),
      Address = '',
      Service_care_no = '',
      City = '',
      Country = '',
      Postal_code = '',
      UserName,
      Password,
      access_token = null
    } = hotelData;

    const result = await request
      .input('Name', sql.NVarChar, Name)
      .input('Logo_url', sql.NVarChar, Logo_url)
      .input('Established_year', sql.Int, Established_year)
      .input('Address', sql.NVarChar, Address)
      .input('Service_care_no', sql.NVarChar, Service_care_no)
      .input('City', sql.NVarChar, City)
      .input('Country', sql.NVarChar, Country)
      .input('Postal_code', sql.NVarChar, Postal_code)
      .input('UserName', sql.NVarChar, UserName)
      .input('Password', sql.NVarChar, Password)
      .input('access_token', sql.NVarChar, access_token)
      .query(`
        INSERT INTO Hotels 
        (name, logo_url, established_year, address, service_care_no, city, country, postal_code, username, password, access_token)
        OUTPUT INSERTED.*
        VALUES (@Name, @Logo_url, @Established_year, @Address, @Service_care_no, @City, @Country, @Postal_code, @UserName, @Password, @access_token)
      `);

    const hotel = result.recordset[0];
    // Remove password from response
    delete hotel.password;
    return hotel;
  }

  /**
   * Find hotel by username
   * @param {String} username - Hotel username
   * @returns {Object} Hotel data
   */
  static async findByUsername(username) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('username', sql.NVarChar, username)
      .query('SELECT * FROM Hotels WHERE username = @username');

    return result.recordset[0];
  }

  /**
   * Find hotel by ID
   * @param {Number} hotelId - Hotel ID
   * @returns {Object} Hotel data
   */
  static async findById(hotelId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .query(`
        SELECT hotel_id, name, logo_url, established_year, address, service_care_no, 
               city, country, postal_code, username, access_token, create_date, update_date
        FROM Hotels 
        WHERE hotel_id = @hotel_id
      `);

    return result.recordset[0];
  }

  /**
   * Get all hotels (without passwords)
   * @returns {Array} List of hotels
   */
  static async findAll() {
    const pool = await getPool();
    const request = pool.request();

    const result = await request.query(`
      SELECT hotel_id, name, logo_url, established_year, address, service_care_no, 
             city, country, postal_code, username, access_token, create_date, update_date
      FROM Hotels
      ORDER BY name
    `);

    return result.recordset;
  }

  /**
   * Update hotel
   * @param {Number} hotelId - Hotel ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated hotel
   */
  static async update(hotelId, updateData) {
    const pool = await getPool();
    const request = pool.request();

    const {
      Name,
      Logo_url,
      Established_year,
      Address,
      Service_care_no,
      City,
      Country,
      Postal_code,
      UserName,
      Password
    } = updateData;

    // Build dynamic query
    const updateFields = [];
    const inputs = { hotel_id: sql.Int, hotelId };

    if (Name !== undefined) {
      updateFields.push('name = @Name');
      inputs.Name = sql.NVarChar;
      inputs.Name_value = Name;
    }
    if (Logo_url !== undefined) {
      updateFields.push('logo_url = @Logo_url');
      inputs.Logo_url = sql.NVarChar;
      inputs.Logo_url_value = Logo_url;
    }
    if (Established_year !== undefined) {
      updateFields.push('established_year = @Established_year');
      inputs.Established_year = sql.Int;
      inputs.Established_year_value = Established_year;
    }
    if (Address !== undefined) {
      updateFields.push('address = @Address');
      inputs.Address = sql.NVarChar;
      inputs.Address_value = Address;
    }
    if (Service_care_no !== undefined) {
      updateFields.push('service_care_no = @Service_care_no');
      inputs.Service_care_no = sql.NVarChar;
      inputs.Service_care_no_value = Service_care_no;
    }
    if (City !== undefined) {
      updateFields.push('city = @City');
      inputs.City = sql.NVarChar;
      inputs.City_value = City;
    }
    if (Country !== undefined) {
      updateFields.push('country = @Country');
      inputs.Country = sql.NVarChar;
      inputs.Country_value = Country;
    }
    if (Postal_code !== undefined) {
      updateFields.push('postal_code = @Postal_code');
      inputs.Postal_code = sql.NVarChar;
      inputs.Postal_code_value = Postal_code;
    }
    if (UserName !== undefined) {
      updateFields.push('username = @UserName');
      inputs.UserName = sql.NVarChar;
      inputs.UserName_value = UserName;
    }
    if (Password !== undefined) {
      updateFields.push('password = @Password');
      inputs.Password = sql.NVarChar;
      inputs.Password_value = Password;
    }

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    updateFields.push('update_date = GETDATE()');

    // Add inputs to request
    Object.keys(inputs).forEach(key => {
      if (key !== 'hotel_id') {
        request.input(key, inputs[key], inputs[`${key}_value`]);
      }
    });

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .query(`
        UPDATE Hotels 
        SET ${updateFields.join(', ')}
        WHERE hotel_id = @hotel_id;
        
        SELECT hotel_id, name, logo_url, established_year, address, service_care_no, 
               city, country, postal_code, username, access_token, create_date, update_date
        FROM Hotels 
        WHERE hotel_id = @hotel_id
      `);

    return result.recordset[0];
  }

  /**
   * Update hotel token
   * @param {Number} hotelId - Hotel ID
   * @param {String} token - Access token
   * @returns {Boolean} Success status
   */
  static async updateToken(hotelId, token) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .input('access_token', sql.NVarChar, token)
      .query('UPDATE Hotels SET access_token = @access_token WHERE hotel_id = @hotel_id');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Update hotel password
   * @param {Number} hotelId - Hotel ID
   * @param {String} hashedPassword - Hashed password
   * @returns {Boolean} Success status
   */
  static async updatePassword(hotelId, hashedPassword) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .input('password', sql.NVarChar, hashedPassword)
      .query('UPDATE Hotels SET password = @password WHERE hotel_id = @hotel_id');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Delete hotel
   * @param {Number} hotelId - Hotel ID
   * @returns {Boolean} Success status
   */
  static async delete(hotelId) {
    const pool = await getPool();
    const request = pool.request();

    const result = await request
      .input('hotel_id', sql.Int, hotelId)
      .query('DELETE FROM Hotels WHERE hotel_id = @hotel_id');

    return result.rowsAffected[0] > 0;
  }

  /**
   * Check if hotel exists
   * @param {Number} hotelId - Hotel ID
   * @returns {Boolean} Exists status
   */
  static async exists(hotelId) {
    const hotel = await this.findById(hotelId);
    return !!hotel;
  }

  /**
   * Check if username exists
   * @param {String} username - Username to check
   * @returns {Boolean} Exists status
   */
  static async usernameExists(username) {
    const hotel = await this.findByUsername(username);
    return !!hotel;
  }
}

module.exports = Hotel;
