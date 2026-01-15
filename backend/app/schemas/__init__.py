from .customer import CustomerCreate, CustomerUpdate, CustomerResponse
from .vehicle import VehicleCreate, VehicleUpdate, VehicleResponse
from .appointment import AppointmentCreate, AppointmentUpdate, AppointmentResponse
from .service import ServiceCreate, ServiceUpdate, ServiceResponse, ServicePartCreate
from .service_type import ServiceTypeResponse
from .part import PartCreate, PartUpdate, PartResponse
from .loyalty import LoyaltyStatusResponse, LoyaltyProgramResponse

__all__ = [
    "CustomerCreate", "CustomerUpdate", "CustomerResponse",
    "VehicleCreate", "VehicleUpdate", "VehicleResponse",
    "AppointmentCreate", "AppointmentUpdate", "AppointmentResponse",
    "ServiceCreate", "ServiceUpdate", "ServiceResponse", "ServicePartCreate",
    "ServiceTypeResponse",
    "PartCreate", "PartUpdate", "PartResponse",
    "LoyaltyStatusResponse", "LoyaltyProgramResponse",
]



