from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from .models import Rating
from .serializers import RatingSerializer
from apps.journeys.models import Journey

class RatingViewSet(viewsets.ModelViewSet):
    queryset = Rating.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Rating.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'], url_path='submit')
    def submit_rating(self, request):
        """Submit a rating for a journey"""
        journey_id = request.data.get('journey_id')
        driver_rating = request.data.get('driver_rating')
        bus_rating = request.data.get('bus_rating')
        service_rating = request.data.get('service_rating')
        comment = request.data.get('comment', '')
        
        if not all([journey_id, driver_rating, bus_rating, service_rating]):
            return Response(
                {'detail': 'journey_id, driver_rating, bus_rating, and service_rating are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            journey = Journey.objects.get(id=journey_id)
        except Journey.DoesNotExist:
            return Response(
                {'detail': 'Journey not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user already rated this journey
        existing_rating = Rating.objects.filter(user=request.user, journey=journey).first()
        if existing_rating:
            return Response(
                {'detail': 'You have already rated this journey'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create the rating
        rating = Rating.objects.create(
            user=request.user,
            journey=journey,
            driver_rating=driver_rating,
            bus_rating=bus_rating,
            service_rating=service_rating,
            comment=comment
        )
        
        serializer = self.get_serializer(rating)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def journey_ratings(self, request, pk=None):
        """Get all ratings for a journey"""
        ratings = Rating.objects.filter(journey_id=pk).select_related('user')
        
        ratings_data = [{
            'id': r.id,
            'driver_rating': r.driver_rating,
            'bus_rating': r.bus_rating,
            'service_rating': r.service_rating,
            'overall_rating': float(r.overall_rating),
            'comment': r.comment,
            'user_name': r.user.get_full_name() or r.user.username,
            'created_at': r.created_at.isoformat()
        } for r in ratings]
        
        return Response(ratings_data)