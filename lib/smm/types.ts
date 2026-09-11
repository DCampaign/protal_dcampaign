export type Provider = { id: string; name: string; endpoint: string };
export type Service = { id: string; provider_id: string; remote_id: string; name: string; category: string; rate: number; min: number; max: number; type: string };
export type Order = { id: string; service_id: string; link: string; quantity: number; status: string; remote_id: string | null; created_at: string; cost: number };
export type PanelData = { providers: Provider[]; services: Service[]; orders: Order[] };
