from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import route_list

#router = DefaultRouter()
#router.register(r'routes', views.RouteViewSet)
#router.register(r'route-stops', views.RouteStopViewSet)

#urlpatterns = [
 #   path('', include(router.urls)),
#]

# apps/routes/urls.py

from rest_framework.routers import DefaultRouter
from .views import RouteViewSet, BusRouteAssignmentViewSet

router = DefaultRouter()
router.register(r'routes', RouteViewSet, basename='routes')
router.register(r'buses/assignments', BusRouteAssignmentViewSet, basename='bus-assignments')

#urlpatterns = router.urls
urlpatterns = [
    path('routes/', route_list, name='route-list'),
    path('by-type/', views.get_routes_by_type, name='get_routes_by_type'),
    path('<int:route_id>/stops/', views.get_stops_by_route, name='get_stops_by_route'),
]
