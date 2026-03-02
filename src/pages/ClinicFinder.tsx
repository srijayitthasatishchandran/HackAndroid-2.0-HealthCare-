import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Phone, Clock } from 'lucide-react';
import { Suspense, lazy, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useApp, Clinic } from '@/context/AppContext';
import AppHeader from '@/components/AppHeader';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/integrations/supabase/client';
import { getDistanceKm } from '@/lib/helpers';

const FALLBACK_CLINICS: Clinic[] = [
  {
    id: 'fallback-1',
    name: 'DOTS Center, AIIMS Delhi',
    address: 'Sri Aurobindo Marg, Ansari Nagar, New Delhi',
    pincode: '110029',
    city: 'New Delhi',
    state: 'Delhi',
    lat: 28.5665,
    lng: 77.2100,
    phone: '011-26588500',
    hours: 'Mon–Sat 9:00 AM – 5:00 PM',
  },
  {
    id: 'fallback-2',
    name: 'Nair Hospital DOTS Center',
    address: 'Dr. A.L. Nair Road, Mumbai Central, Mumbai',
    pincode: '400008',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 18.9696,
    lng: 72.8194,
    phone: '022-23027654',
    hours: 'Mon–Sat 9:00 AM – 5:00 PM',
  },
  {
    id: 'fallback-3',
    name: 'Stanley Medical College DOTS',
    address: 'Old Washermanpet, Chennai',
    pincode: '600001',
    city: 'Chennai',
    state: 'Tamil Nadu',
    lat: 13.1013,
    lng: 80.2897,
    phone: '044-25281347',
    hours: 'Mon–Sat 9:00 AM – 5:00 PM',
  },
  {
    id: 'fallback-4',
    name: 'Osmania General Hospital DOTS',
    address: 'Afzal Gunj, Hyderabad',
    pincode: '500012',
    city: 'Hyderabad',
    state: 'Telangana',
    lat: 17.3713,
    lng: 78.4738,
    phone: '040-24600146',
    hours: 'Mon–Sat 9:00 AM – 5:00 PM',
  },
  {
    id: 'fallback-5',
    name: 'Victoria Hospital DOTS Center',
    address: 'Fort, Bengaluru',
    pincode: '560002',
    city: 'Bengaluru',
    state: 'Karnataka',
    lat: 12.9593,
    lng: 77.5736,
    phone: '080-26701150',
    hours: 'Mon–Sat 9:00 AM – 5:00 PM',
  },
  {
    id: 'fallback-6',
    name: 'Sawai Man Singh Hospital DOTS',
    address: 'Gautam Marg, Jaipur',
    pincode: '302004',
    city: 'Jaipur',
    state: 'Rajasthan',
    lat: 26.9006,
    lng: 75.8153,
    phone: '0141-2560291',
    hours: 'Mon–Sat 9:00 AM – 5:00 PM',
  },
  {
    id: 'fallback-7',
    name: 'PGIMER DOTS Center',
    address: 'Sector 12, Chandigarh',
    pincode: '160012',
    city: 'Chandigarh',
    state: 'Chandigarh',
    lat: 30.7633,
    lng: 76.7731,
    phone: '0172-2747585',
    hours: 'Mon–Sat 9:00 AM – 5:00 PM',
  },
  {
    id: 'fallback-8',
    name: 'Kolkata Medical College DOTS',
    address: 'College Street, Kolkata',
    pincode: '700073',
    city: 'Kolkata',
    state: 'West Bengal',
    lat: 22.5736,
    lng: 88.3639,
    phone: '033-22123012',
    hours: 'Mon–Sat 9:00 AM – 5:00 PM',
  },
];

const ClinicFinder = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { setSelectedClinic, userPincode, setUserPincode } = useApp();
  const [clinics, setClinics] = useState<(Clinic & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(false);
  const [pincode, setPincode] = useState(userPincode);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const MapLoader: React.FC<{
    clinics: (Clinic & { distance?: number })[];
    center: [number, number];
    zoom: number;
    onSelect: (c: Clinic) => void;
    bookLabel: string;
  }> = ({ clinics, center, zoom, onSelect, bookLabel }) => {
    const [Comp, setComp] = useState<null | React.ComponentType<any>>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
      import('@/components/MapBasic')
        .then((m) => setComp(() => m.default))
        .catch(() => setFailed(true));
    }, []);
    if (failed) {
      return (
        <div className="p-4 text-sm text-muted-foreground">
          Map unavailable. Showing clinics list.
        </div>
      );
    }
    if (!Comp) {
      return <div className="p-4 text-sm text-muted-foreground">Loading map…</div>;
    }
    return <Comp clinics={clinics} center={center} zoom={zoom} onSelect={onSelect} bookLabel={bookLabel} />;
  };
  useEffect(() => {}, []);

  const fetchClinics = async (pin?: string, loc?: { lat: number; lng: number }) => {
    setLoading(true);
    try {
      setError(null);
      let query = supabase.from('clinics').select('*');
      if (pin && pin.length >= 3) {
        query = query.like('pincode', `${pin.slice(0, 3)}%`);
      }
      const { data, error } = await query.order('name').limit(10);
      let results = (data || []) as Clinic[];
      if (error || results.length === 0) {
        results = FALLBACK_CLINICS.filter(c =>
          pin && pin.length >= 3 ? c.pincode.startsWith(pin.slice(0, 3)) : true
        );
      }

      if (loc) {
        results = results.map(c => ({
          ...c,
          distance: getDistanceKm(loc.lat, loc.lng, c.lat, c.lng),
        })).sort((a, b) => (a as any).distance - (b as any).distance);
      }
      setClinics(results as any);
    } catch (err) {
      setError('Unable to load clinics from server. Showing nearby options.');
      let results = FALLBACK_CLINICS.filter(c =>
        pin && pin.length >= 3 ? c.pincode.startsWith(pin.slice(0, 3)) : true
      );
      if (loc) {
        results = results.map(c => ({
          ...c,
          distance: getDistanceKm(loc.lat, loc.lng, c.lat, c.lng),
        })).sort((a, b) => (a as any).distance - (b as any).distance);
      }
      setClinics(results as any);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (pincode.length >= 3) {
      setUserPincode(pincode);
      fetchClinics(pincode, userLocation || undefined);
    }
  };

  const handleUseLocation = () => {
    if (!('geolocation' in navigator)) {
      fetchClinics();
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        fetchClinics(undefined, loc);
      },
      () => {
        fetchClinics();
      }
    );
  };

  useEffect(() => {
    fetchClinics(userPincode || undefined);
  }, []);

  const selectClinic = (clinic: Clinic) => {
    setSelectedClinic(clinic);
    navigate('/book');
  };

  const mapCenter: [number, number] = clinics.length > 0
    ? [clinics[0].lat, clinics[0].lng]
    : [20.5937, 78.9629];

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <AppHeader title={t('clinicsNearYou')} showBack backRoute="/result" />

      <div className="app-container py-4 space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder={t('enterPincode')}
            className="flex-1 h-12 bg-card border border-border rounded-xl px-4 text-base outline-none focus:border-primary transition-colors"
          />
          <button onClick={handleSearch} className="h-12 px-5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm">
            {t('search')}
          </button>
        </div>
        <button onClick={handleUseLocation} className="flex items-center gap-2 text-sm text-primary font-semibold">
          <MapPin className="w-4 h-4" /> {t('useLocation')}
        </button>

        <div className="rounded-xl overflow-hidden border border-border" style={{ height: 280 }}>
          <MapLoader
            clinics={clinics}
            center={mapCenter}
            zoom={clinics.length > 0 ? 12 : 5}
            onSelect={selectClinic}
            bookLabel={t('bookAppointment')}
          />
        </div>

        {/* Clinics List */}
        {error && (
          <p className="text-xs text-muted-foreground">{error}</p>
        )}
        {loading ? (
          <div className="flex justify-center py-8"><LoadingSpinner className="w-8 h-8" /></div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{t('noClinics')}</p>
            <a href="tel:1800116666" className="inline-block bg-primary text-primary-foreground rounded-xl px-6 py-3 font-bold">
              📞 {t('nationalHelpline')}
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {clinics.map((c) => (
              <div key={c.id} className="bg-card rounded-xl p-4 card-shadow">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-base text-foreground">{c.name}</h3>
                  {c.distance !== undefined && (
                    <span className="text-xs bg-primary-light text-primary px-2 py-1 rounded-full font-semibold whitespace-nowrap">
                      {c.distance.toFixed(1)} km
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{c.address}</p>
                {c.hours && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {c.hours}
                  </p>
                )}
                {c.phone && (
                  <a href={`tel:${c.phone}`} className="text-xs text-primary mt-1 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {c.phone}
                  </a>
                )}
                <button
                  onClick={() => selectClinic(c)}
                  className="w-full mt-3 h-11 bg-primary text-primary-foreground rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                >
                  {t('bookAppointment')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClinicFinder;
