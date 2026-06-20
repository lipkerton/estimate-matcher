from django.db.models import Count
from rest_framework import filters, viewsets

from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("name", "description")
    ordering_fields = ("id", "name", "created_at", "updated_at")
    ordering = ("-created_at",)

    def get_queryset(self):
        return Project.objects.annotate(
            estimates_count=Count("estimates"),
        )
