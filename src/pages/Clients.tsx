import { useParams } from 'react-router-dom';
import { ClientsList } from '@/components/clients/ClientsList';
import { ClientOverview } from '@/components/clients/ClientOverview';

export const Clients = () => {
  const { clientId } = useParams<{ clientId: string }>();

  if (clientId) {
    return <ClientOverview />;
  }

  return <ClientsList />;
};