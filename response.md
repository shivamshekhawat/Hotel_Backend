data class LoginEntity(
    @SerializedName("userId") val userId : String,
    @SerializedName("password") val password : String,
    @SerializedName("fcmToken") val fcmToken : String,
    @SerializedName("deviceId") val deviceId : String
)


// DashBoade

data class DashBoarderApiResponse(
    val response : DashboardItem,
    val message : String,
    val status: Int
)

data class DashboardItem(
    val roomId: Long,
    val roomNo : Int,
    val hotel: Hotel,
    val guest: Guest,
    val reservation: Reservation,
    val cleanRoom: CleanRoom,
    val weather: WeatherInfo,
    val controls: Controls,
    val dnd: Dnd,
    val contact: Contact,
    val notifications: List<Notification>
)

data class Hotel(
    val hotelId: Int,
    val name: String,
    val logoUrl: String,
    val establishedYear: Int,
    val address: Address
)

data class Address(
    val street: String,
    val city: String,
    val country: String,
    val postalCode: String
)

data class Guest(
    val guestId: Int,
    val name: String,
    val adults: Int,
    val children: Int,
    val language: String
)

data class Reservation(
    val reservationId: Int,
    val checkInTime: String,
    val checkOutTime: String,
    val isCheckedIn: Boolean
)

data class CleanRoom(
    val lastRequestTime: String,
    val status: String,
    val pending: Boolean
)

data class WeatherInfo(
    val time: String,
    val tempC: Int,
    val weather_code: Int,
    val condition: String,
    val weather_image: String,

    )

data class Controls(
    val masterLight: Boolean,
    val readingLight: Boolean,
    val masterCurtain: Boolean,
    val masterWindow: Boolean,
    val lightMode: String,
    val temperature: Temperature?
)

data class Temperature(
    val currentTemp: Int,
    val setTemp: Int
)

data class Dnd(
    val isActive: Boolean,
    val updatedTime: String
)

data class Contact(
    val phoneNumber: String
)

data class Notification(
    val id: Int,
    val message: String,
    val isRead: Boolean
)


// action 
data class RoomControlsRequest(
    val isCheckin: Boolean,
    val roomId :Long,
    val isDndOn :Boolean,
    val lightningControl : Controls,
)


data class FeedbackRequest(
    val reservationId : Long,
    val comment : String,
    val rating : Int
)

data class CleanService(
    val reservationId:Long,
    val time : String,
    val status : String,
)

data class GetCleanServiceList(
    val reservationId: Int,
)


data class ApiResponseCleaningService(
    val response : CleanServiceResponse,
    val message : String,
    val status: Int
)
data class CleanServiceResponse(

    val serviceId :Long,
    val reservationId: Long,
    val serviceType : String,
    val requestTime : String,
    val status : String,
)


data class ApiResponse(
    val response: List<GetCleanServiceRequest>,
    val message: String,
    val status: Int
)

data class GetCleanServiceRequest(
    val serviceId: Long,
    val reservationId :Long,
    val serviceType : String ,
    val requestTime : String,
    val status : String,
)

data class TechIssueRequest(
    val reservationId : Long,
    val issue : String,
    val time : String
)

data class TechIssueResponse(
    val issueId: String ,
    val status: String,
    val message: String
)


    @POST("api/auth/signin")
    suspend fun  loginUser(@Body longin: LoginEntity): Any
    @GET("api/room/{id}")
    suspend fun getDashBoardData(@Path("id") roomId : Int): DashBoarderApiResponse

    @POST("api/room/action")
    suspend fun action(@Body roomControl: RoomControlsRequest): DashBoarderApiResponse

    @POST("api/room/feedback")
    suspend fun feedback(@Body feedback: FeedbackRequest): List<Any?>

    @POST("api/room/cleanService")
    suspend fun roomCleanRequest(@Body cleanService: CleanService): ApiResponseCleaningService

    @POST("api/room/cleanService/get")
    suspend fun getAllRoomCleanRequest(@Body cleanService: GetCleanServiceList): ApiResponse

    @POST("api/room/tech-issue")
    suspend fun reportTechIssue(@Body techIssue: TechIssueRequest): TechIssueResponse
