import apiClient from './api';

const normalizePage = (data) => ({
  content: Array.isArray(data?.content) ? data.content : [],
  totalElements: data?.totalElements ?? 0,
  totalPages: data?.totalPages ?? 1,
  page: data?.page ?? 0,
  size: data?.size ?? 20,
  isFirst: data?.first ?? (data?.page === 0),
  isLast: data?.last ?? (data?.page >= (data?.totalPages ?? 1) - 1),
});

const adminListingApi = {
  getListings: async (params = {}) => normalizePage(
    await apiClient.get('/admin/listings', { params })
  ),
  createListing: (payload) => apiClient.post('/admin/listings', payload),
  updateListing: (listingId, payload) => apiClient.put(`/admin/listings/${listingId}`, payload),
  updateStatus: (listingId, status) => apiClient.put(`/admin/listings/${listingId}/status`, null, {
    params: { status },
  }),
  deleteListing: (listingId) => apiClient.delete(`/admin/listings/${listingId}`),
};

export default adminListingApi;
