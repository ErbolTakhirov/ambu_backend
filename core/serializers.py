from rest_framework import serializers
from .models import Hospital, TrafficSegment, RouteRequest

class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = '__all__'

class TrafficSegmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrafficSegment
        fields = '__all__'

class RouteRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteRequest
        fields = '__all__'
