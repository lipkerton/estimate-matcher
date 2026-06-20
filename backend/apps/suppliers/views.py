from rest_framework import filters, viewsets

from apps.suppliers.models import Supplier
from apps.suppliers.serializers import SupplierSerializer


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = ("name", "inn")
    ordering_fields = ("id", "name", "created_at", "updated_at")
    ordering = ("name",)
