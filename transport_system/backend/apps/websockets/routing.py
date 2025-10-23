from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/bus-tracking/(?P<bus_id>\w+)/$', consumers.BusTrackingConsumer.as_asgi()),
    re_path(r'ws/driver-notifications/(?P<driver_id>\w+)/$', consumers.DriverNotificationConsumer.as_asgi()),
    re_path(r'ws/passenger-updates/(?P<user_id>\w+)/$', consumers.PassengerUpdateConsumer.as_asgi()),
]
