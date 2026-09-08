import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';

// Fetches backend-filtered advertisements for an authenticated school user.
// All visibility rules (is_active, date window, target audience, dismissed)
// are handled server-side - the frontend only renders what's returned.
export function useAdvertisements(position) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = position ? `?position=${encodeURIComponent(position)}` : '';
      const res = await api.get(`/ads${q}`);
      setAds(res.data?.advertisements || []);
    } catch (e) {
      setAds([]);
    } finally {
      setLoading(false);
    }
  }, [position]);

  useEffect(() => {
    load();
  }, [load]);

  const dismiss = useCallback(async (adId) => {
    try {
      await api.post(`/ads/${adId}/dismiss`);
      setAds((prev) => prev.filter((a) => a.id !== adId));
    } catch (e) {
      // Ignore - the ad will simply show again next load.
    }
  }, []);

  return { ads, loading, dismiss, reload: load };
}