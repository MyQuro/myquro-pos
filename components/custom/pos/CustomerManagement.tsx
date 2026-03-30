"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  User as UserIcon, 
  Phone as PhoneIcon, 
  Email as EmailIcon, 
  TrashCan, 
  Edit, 
  Add,
  UserAvatar,
  Analytics,
  ChevronRight
} from "@carbon/icons-react";
import { motion, AnimatePresence } from "framer-motion";

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  segment: string;
  totalSpent: number;
  loyaltyPoints: number;
};

const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

export default function CustomerManagement() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [segment, setSegment] = useState("Retail");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  async function fetchCustomers() {
    setLoading(true);
    try {
      const res = await fetch("/api/pos/customers");
      if (res.ok) {
        const data = await res.json();
        setCustomers(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreateModal() {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setEmail("");
    setSegment("Retail");
    setIsModalOpen(true);
  }

  function openEditModal(c: Customer) {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email || "");
    setSegment(c.segment);
    setIsModalOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this customer?")) return;

    try {
      const res = await fetch(`/api/pos/customers/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      } else {
        alert("Failed to delete customer");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting customer");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !phone) return;

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        const res = await fetch(`/api/pos/customers/${editingCustomer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, segment }),
        });

        if (res.ok) {
          const updated = await res.json();
          setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          setIsModalOpen(false);
        }
      } else {
        const res = await fetch("/api/pos/customers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, phone, email, segment }),
        });

        if (res.ok) {
          const newCustomer = await res.json();
          setCustomers((prev) => [newCustomer, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto dark">
      {/* Header Area */}
      <div className="flex justify-between items-end border-b border-neutral-800 pb-6">
        <div>
          <h2 className="text-3xl font-semibold text-neutral-50 tracking-tight">Customers</h2>
          <p className="text-neutral-400 text-sm mt-1">Manage your relationship with {customers.length} business partners.</p>
        </div>
        <Button 
          onClick={openCreateModal}
          className="bg-neutral-50 text-black hover:bg-neutral-200 rounded-xl px-6 h-11 flex gap-2 font-medium transition-all active:scale-95"
        >
          <Add size={20} />
          Add Customer
        </Button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard title="Total Customers" value={customers.length.toString()} icon={<UserAvatar size={20} />} />
        <StatsCard title="Loyal Members" value={customers.filter(c => c.segment === "Loyal").length.toString()} icon={<Analytics size={20} />} />
        <StatsCard title="Monthly Growth" value="+12%" icon={<Analytics size={20} />} trend="up" />
      </div>

      {/* Main List Area */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-500 gap-3">
            <div className="animate-spin size-6 border-2 border-neutral-700 border-t-neutral-400 rounded-full" />
            <p className="text-sm font-light">Retrieving database records...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed border-neutral-800 rounded-3xl text-neutral-500">
            <UserIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>No customers found in your directory.</p>
          </div>
        ) : (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } }
            }}
            className="grid gap-3"
          >
            {customers.map((c) => (
              <CustomerListItem 
                key={c.id} 
                customer={c} 
                onEdit={() => openEditModal(c)} 
                onDelete={() => handleDelete(c.id)} 
              />
            ))}
          </motion.div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="bg-[#0a0a0a] border-neutral-800 text-neutral-50 rounded-2xl max-w-md">
          <DialogHeader className="border-b border-neutral-800 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              {editingCustomer ? "Edit Customer" : "New Customer"}
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Profile details for business engagement.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5 py-6">
            <div className="space-y-2 text-sm">
              <Label className="text-neutral-400">Full Name</Label>
              <Input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="bg-neutral-900 border-neutral-800 focus:border-neutral-500 rounded-xl h-11 transition-all"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-sm">
                <Label className="text-neutral-400">Phone</Label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required 
                  className="bg-neutral-900 border-neutral-800 focus:border-neutral-500 rounded-xl h-11 transition-all"
                />
              </div>
              <div className="space-y-2 text-sm">
                <Label className="text-neutral-400">Segment</Label>
                <select
                  className="flex h-11 w-full rounded-xl border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm focus:border-neutral-500 transition-all outline-none"
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                >
                  <option value="Retail">Retail</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Loyal">Loyal</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <Label className="text-neutral-400">Email Address (Optional)</Label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="bg-neutral-900 border-neutral-800 focus:border-neutral-500 rounded-xl h-11 transition-all"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 border-neutral-800 text-neutral-400 hover:bg-neutral-900 h-11 rounded-xl"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !name || !phone}
                className="flex-1 bg-neutral-50 text-black hover:bg-neutral-200 h-11 rounded-xl font-medium"
              >
                {isSubmitting ? "Processing..." : editingCustomer ? "Update" : "Create Profile"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({ title, value, icon, trend }: { title: string; value: string; icon: React.ReactNode; trend?: "up" | "down" }) {
  return (
    <div className="bg-neutral-900/40 border border-neutral-800 p-5 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between text-neutral-400 mb-2">
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
        {icon}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-semibold text-neutral-50 leading-none">{value}</span>
        {trend && (
          <span className={`text-xs font-medium mb-0.5 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </div>
  );
}

function CustomerListItem({ customer, onEdit, onDelete }: { customer: Customer; onEdit: () => void; onDelete: () => void }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ ease: [0.25, 1.1, 0.4, 1], duration: 0.4 }}
      className="group flex items-center gap-4 bg-[#0d0d0d] hover:bg-neutral-900/80 border border-neutral-800/60 p-4 rounded-2xl transition-all duration-300"
    >
      <div className="size-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300 shrink-0">
        <UserIcon size={24} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-neutral-100 truncate">{customer.name}</h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-tight
            ${customer.segment === "Loyal" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
              customer.segment === "Wholesale" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : 
              "bg-neutral-500/10 text-neutral-500 border border-neutral-500/20"}`}>
            {customer.segment}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
            <PhoneIcon size={12} />
            <span>{customer.phone}</span>
          </div>
          {customer.email && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-400">
              <EmailIcon size={12} />
              <span>{customer.email}</span>
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:flex flex-col items-end px-8 shrink-0">
        <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-medium">Net Revenue</div>
        <div className="text-sm font-semibold text-green-500/90">₹{(customer.totalSpent / 100).toLocaleString()}</div>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
        <button 
          onClick={onEdit}
          className="p-2 text-neutral-400 hover:text-neutral-50 hover:bg-neutral-800 rounded-lg transition-colors"
          title="Edit Profile"
        >
          <Edit size={18} />
        </button>
        <button 
          onClick={onDelete}
          className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          title="Delete Profile"
        >
          <TrashCan size={18} />
        </button>
        <div className="ml-2 pl-4 border-l border-neutral-800">
          <ChevronRight size={20} className="text-neutral-700 group-hover:text-neutral-400 transition-colors" />
        </div>
      </div>
    </motion.div>
  );
}
