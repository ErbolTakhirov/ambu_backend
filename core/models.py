from django.db import models

class Hospital(models.Model):
    name = models.CharField(max_length=255)
    latitude = models.FloatField()
    longitude = models.FloatField()
    address = models.CharField(max_length=500, blank=True, null=True)

    def __str__(self):
        return self.name

class TrafficSegment(models.Model):
    start_latitude = models.FloatField()
    start_longitude = models.FloatField()
    end_latitude = models.FloatField()
    end_longitude = models.FloatField()
    weight = models.FloatField(help_text="Imitated traffic weight or speed")
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Segment {self.id} (Weight: {self.weight})"

class RouteRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('calculated', 'Calculated'),
        ('error', 'Error'),
    )

    start_latitude = models.FloatField()
    start_longitude = models.FloatField()
    end_latitude = models.FloatField()
    end_longitude = models.FloatField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    # Storing results as JSON. SQLite can handle this as Text, Postgres has JSONField.
    # For compatibility and simplicity in this hackathon setup, we can use JSONField if using a version of Django/DB that supports it,
    # or just TextField if strictly SQLite without JSON extension support (though Django 3.0+ supports JSONField on SQLite with some caveats).
    # Since we are on Django 5+, using models.JSONField is generally safe even with SQLite (it uses a text fallback).
    shortest_path_coords = models.JSONField(blank=True, null=True, help_text="List of [lat, lon] for shortest path")
    optimized_path_coords = models.JSONField(blank=True, null=True, help_text="List of [lat, lon] for AI optimized path")

    def __str__(self):
        return f"Route {self.id} ({self.status})"
