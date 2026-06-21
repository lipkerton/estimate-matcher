from rest_framework import filters, viewsets

from apps.matching.models import MatchCandidate
from apps.matching.serializers import MatchCandidateSerializer


class MatchCandidateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = MatchCandidateSerializer
    filter_backends = (filters.SearchFilter, filters.OrderingFilter)
    search_fields = (
        "estimate_item__raw_name",
        "product__name",
        "product__sku",
    )
    ordering_fields = ("id", "confidence", "created_at")
    ordering = ("-confidence",)

    def get_queryset(self):
        queryset = MatchCandidate.objects.select_related(
            "estimate_item",
            "product",
        )

        estimate_item_id = self.request.query_params.get("estimate_item")
        if estimate_item_id:
            queryset = queryset.filter(estimate_item_id=estimate_item_id)

        estimate_id = self.request.query_params.get("estimate")
        if estimate_id:
            queryset = queryset.filter(estimate_item__estimate_id=estimate_id)

        source = self.request.query_params.get("source")
        if source:
            queryset = queryset.filter(source=source)

        return queryset
