
import fs from 'fs';
import path from 'path';
import '../return-policy/policy.css';
import './overrides.css';
import PolicyContent from './PolicyContent';
import PageEffects from './PageEffects';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export const metadata = {
  title: 'Privacy Policy | Pure Grain Exports',
  description: 'Learn how Pure Grain Exports collects, uses, and protects personal and business data from our global B2B leather trade partners.',
  robots: 'index, follow',
};

const html = fs.readFileSync(path.join(process.cwd(), 'app/privacy-policy/policy-body.html'), 'utf8');

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="policyPage">
        <PolicyContent html={html} />
      </main>
      <PageEffects />
      <Footer />
    </>
  );
}
