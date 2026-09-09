import { PortalHeader } from "@/components/portal-header";
import { EmailPortalClient } from "./email-portal-client";

export default function EmailPortalPage() { return <main className="min-h-screen bg-brand-bg text-white"><PortalHeader solid /><EmailPortalClient /></main>; }