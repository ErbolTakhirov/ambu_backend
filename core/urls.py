from django.urls import path
from .views import HospitalListView, RouteCalculateView, RouteStatusView

urlpatterns = [
    path('hospitals/', HospitalListView.as_view(), name='hospital-list'),
    path('route/calculate/', RouteCalculateView.as_view(), name='route-calculate'),
    path('route/status/<int:id>/', RouteStatusView.as_view(), name='route-status'),
]
