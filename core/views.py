from rest_framework import generics, views, status
from rest_framework.response import Response
from .models import Hospital, RouteRequest
from .serializers import HospitalSerializer, RouteRequestSerializer
from .services import calculate_route

class HospitalListView(generics.ListAPIView):
    queryset = Hospital.objects.all()
    serializer_class = HospitalSerializer

class RouteCalculateView(views.APIView):
    def post(self, request, *args, **kwargs):
        start_lat = request.data.get('start_latitude')
        start_lon = request.data.get('start_longitude')
        end_lat = request.data.get('end_latitude')
        end_lon = request.data.get('end_longitude')

        if not all([start_lat, start_lon, end_lat, end_lon]):
            return Response({"error": "Missing coordinates"}, status=status.HTTP_400_BAD_REQUEST)

        # Create the request object
        route_request = RouteRequest.objects.create(
            start_latitude=start_lat,
            start_longitude=start_lon,
            end_latitude=end_lat,
            end_longitude=end_lon,
            status='pending'
        )

        try:
            # Call routing logic (Person 3)
            # In a real async setup, this might be a Celery task. 
            # For hackathon, synchronous is likely fine or we can use threading if it's slow.
            shortest, optimized = calculate_route(
                [float(start_lat), float(start_lon)],
                [float(end_lat), float(end_lon)]
            )
            
            route_request.shortest_path_coords = shortest
            route_request.optimized_path_coords = optimized
            route_request.status = 'calculated'
            route_request.save()
            
            return Response(RouteRequestSerializer(route_request).data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            route_request.status = 'error'
            route_request.save()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RouteStatusView(generics.RetrieveAPIView):
    queryset = RouteRequest.objects.all()
    serializer_class = RouteRequestSerializer
    lookup_field = 'id'
