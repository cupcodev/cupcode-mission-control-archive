// Core Data Layer - Clients and Services
export { clientsRepo } from './clientsRepo';
export { servicesCatalogRepo } from './servicesCatalogRepo';
export { clientServicesRepo } from './clientServicesRepo';

// Re-export types for convenience
export type { Client, CreateClientInput, UpdateClientInput } from './clientsRepo';
export type { ServiceCatalog, CreateServiceInput, UpdateServiceInput } from './servicesCatalogRepo';
export type { ClientService, ClientServiceWithDetails } from './clientServicesRepo';