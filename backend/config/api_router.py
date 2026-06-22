from rest_framework.routers import DefaultRouter

from apps.catalog.views import ProductGroupViewSet, ProductViewSet
from apps.estimates.views import EstimateItemViewSet, EstimateViewSet
from apps.imports.views import ImportFileViewSet, ImportJobViewSet
from apps.matching.views import MatchCandidateViewSet
from apps.prices.views import PriceListViewSet, SupplierPriceItemViewSet
from apps.projects.views import ProjectViewSet
from apps.suppliers.views import SupplierViewSet


router = DefaultRouter()

router.register("suppliers", SupplierViewSet, basename="supplier")
router.register("product-groups", ProductGroupViewSet, basename="product-group")
router.register("products", ProductViewSet, basename="product")
router.register("projects", ProjectViewSet, basename="project")
router.register(
    "supplier-price-items", SupplierPriceItemViewSet, basename="supplier-price-item"
)
router.register("price-lists", PriceListViewSet, basename="price-list")
router.register("estimates", EstimateViewSet, basename="estimate")
router.register("estimate-items", EstimateItemViewSet, basename="estimate-item")
router.register("import-files", ImportFileViewSet, basename="import-file")
router.register("import-jobs", ImportJobViewSet, basename="import-job")
router.register("match-candidates", MatchCandidateViewSet, basename="match-candidate")
