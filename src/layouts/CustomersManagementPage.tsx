import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "../components/AdminShell";
import { CustomerDetailsPanel } from "../components/CustomerDetailsPanel";
import { CustomersTable } from "../components/CustomersTable";
import type { AdminSection, Customer, FeatureAccess } from "../types/dashboard";

type CustomersManagementPageProps = {
  restaurantName: string;
  userName: string;
  featureAccess: FeatureAccess;
  initialCustomers: Customer[];
  onLogout: () => void;
  onNavigate: (item: AdminSection) => void;
  onToggleCustomerBlock: (customerId: string, status: Customer["status"]) => Promise<void>;
};

export function CustomersManagementPage({
  restaurantName,
  userName,
  featureAccess,
  initialCustomers,
  onLogout,
  onNavigate,
  onToggleCustomerBlock,
}: CustomersManagementPageProps) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialCustomers[0]?.id ?? null,
  );

  useEffect(() => {
    setCustomers(initialCustomers);
  }, [initialCustomers]);

  useEffect(() => {
    if (!customers.length) {
      setSelectedCustomerId(null);
      return;
    }

    if (!selectedCustomerId || !customers.some((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(customers[0]?.id ?? null);
    }
  }, [customers, selectedCustomerId]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(normalizedSearch) ||
        customer.phone.toLowerCase().includes(normalizedSearch),
    );
  }, [customers, searchTerm]);

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId],
  );

  function handleViewHistory(customer: Customer) {
    setSelectedCustomerId(customer.id);
  }

  function handleEditCustomer(customer: Customer) {
    setSelectedCustomerId(customer.id);
  }

  async function handleToggleBlock(customerId: string) {
    const target = customers.find((customer) => customer.id === customerId);

    if (!target) {
      return;
    }

    const nextStatus = target.status === "Ativo" ? "Bloqueado" : "Ativo";

    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId ? { ...customer, status: nextStatus } : customer,
      ),
    );

    await onToggleCustomerBlock(customerId, nextStatus);
  }

  return (
    <AdminShell
      activeSection="Clientes"
      restaurantName={restaurantName}
      userName={userName}
      featureAccess={featureAccess}
      pageTitle="Clientes"
      pageSubtitle="Consulte a base que nasce no mobile e acompanhe historico, recorrencia e bloqueios."
      onLogout={onLogout}
      onNavigate={onNavigate}
      aside={<CustomerDetailsPanel customer={selectedCustomer} />}
    >
      <CustomersTable
        customers={filteredCustomers}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onViewHistory={handleViewHistory}
        onEditCustomer={handleEditCustomer}
        onToggleBlock={handleToggleBlock}
      />
    </AdminShell>
  );
}
