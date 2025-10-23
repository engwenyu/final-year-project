from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Route,Stop
from .models import Route, BusRouteAssignment
from .serializers import RouteSerializer, BusRouteAssignmentSerializer
from .serializers import RouteSerializer, StopSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response

# apps/routes/views.py

class RouteViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Route.objects.prefetch_related('stops').all()
    serializer_class = RouteSerializer


class BusRouteAssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = BusRouteAssignment.objects.select_related('bus', 'route').all()
    serializer_class = BusRouteAssignmentSerializer


# views.py
@api_view(['GET'])
def route_list(request):
    """
    Returns all active routes for the frontend dropdown
    """
    routes = Route.objects.filter(is_active=True)
    serializer = RouteSerializer(routes, many=True)
    return Response(serializer.data)

# ✅ 1. Fetch all route types and routes
#@api_view(['GET'])
#def get_routes_by_type(request):
 #   route_type = request.GET.get('route_type')  # e.g. intercity / outercity
  #  routes = Route.objects.filter(route_type=route_type)
   # data = [
    #    {
     #       'id': route.id,
      #      'start_location': route.start_location,
       #     'end_location': route.end_location,
        #}
        #for route in routes
    #]
    #return Response(data)

# ✅ 2. Fetch stops for a route (with fares)
@api_view(['GET'])
def get_stops_by_route(request, route_id):
    stops = Stop.objects.filter(route_id=route_id).order_by('order')
    data = [
        {
            'id': stop.id,
            'name': stop.name,
            'fare': stop.fare,
            'order': stop.order,
        }
        for stop in stops
    ]
    return Response(data)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated  # or AllowAny if public
from rest_framework.response import Response
from .models import Route
from .serializers import RouteSerializer

@api_view(['GET'])
# @permission_classes([IsAuthenticated])  # enable if you require auth
def get_routes_by_type(request):
    route_type = request.GET.get('route_type')
    qs = Route.objects.filter(route_type=route_type, is_active=True)
    serializer = RouteSerializer(qs, many=True)
    return Response(serializer.data)
