from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, logout
from .models import CustomUser as User
from .models import CustomUser
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from rest_framework import permissions
# apps/authentication/views.py
from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


class LoginView(ObtainAuthToken):
    permission_classes = (AllowAny,)
    
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        user = authenticate(username=username, password=password)
        
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )


class LogoutView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    
    def post(self, request):
        try:
            request.user.auth_token.delete()
            logout(request)
            return Response({'message': 'Successfully logged out'})
        except:
            return Response({'error': 'Error logging out'}, 
                          status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)
    
    def get_object(self):
        return self.request.user


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser,]


User = get_user_model()

class DriverListView(generics.ListAPIView):
    queryset = User.objects.filter(user_type="driver").order_by("id")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

class PassengerListView(generics.ListAPIView):
    queryset = User.objects.filter(user_type="passenger").order_by("id")
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]

# views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import PassengerSerializer

User = get_user_model()

class PassengerDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.user_type != "passenger":
            return Response({"error": "Not a passenger"}, status=403)
        serializer = PassengerSerializer(request.user)
        return Response(serializer.data)
