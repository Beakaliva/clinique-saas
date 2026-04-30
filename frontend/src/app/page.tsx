'use client'

import Link from 'next/link'
import {
  Activity, Users, Calendar, Stethoscope, Receipt, ClipboardList,
  Shield, BarChart3, Heart, ArrowRight, CheckCircle2, Star,
  Phone, Mail, MapPin, Menu, X, FlaskConical, BedDouble, Pill,
  Zap, Lock, Globe, ChevronRight,
} from 'lucide-react'
import { useState } from 'react'

// ── Data ────────────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Starter',
    price: '150 000',
    currency: 'GNF',
    period: '/mois',
    desc: 'Idéal pour les petits cabinets',
    color: 'border-gray-200',
    badge: '',
    features: [
      '1 à 3 utilisateurs',
      'Gestion des patients',
      'Rendez-vous & consultations',
      'Ordonnances',
      'Support par email',
    ],
  },
  {
    name: 'Pro',
    price: '350 000',
    currency: 'GNF',
    period: '/mois',
    desc: 'Pour les cliniques en croissance',
    color: 'border-blue-500',
    badge: 'Populaire',
    features: [
      'Utilisateurs illimités',
      'Tous les modules',
      'Facturation & assurance',
      'Pharmacie & Laboratoire',
      'Rapports & statistiques',
      'Support prioritaire',
    ],
  },
  {
    name: 'Hôpital',
    price: 'Sur devis',
    currency: '',
    period: '',
    desc: 'Pour les structures multi-sites',
    color: 'border-gray-200',
    badge: '',
    features: [
      'Multi-sites / multi-cliniques',
      'Radiologie & hospitalisations',
      'Intégrations sur mesure',
      'Formation du personnel',
      'SLA & support 24/7',
      'Déploiement dédié',
    ],
  },
]

const MODULES = [
  { icon: Users,        label: 'Patients',         desc: 'Dossiers complets, historique médical, assurance' },
  { icon: Calendar,     label: 'Rendez-vous',       desc: 'Planning, confirmations, gestion des créneaux' },
  { icon: Stethoscope,  label: 'Consultations',     desc: 'Notes cliniques, soins associés, suivi' },
  { icon: ClipboardList,label: 'Ordonnances',       desc: 'Prescriptions numériques, médicaments, posologie' },
  { icon: Receipt,      label: 'Facturation',       desc: 'Factures, prise en charge assurance, suivi paiements' },
  { icon: FlaskConical, label: 'Laboratoire',       desc: 'Résultats d\'analyses, référencement' },
  { icon: Pill,         label: 'Pharmacie',         desc: 'Stock de médicaments, alertes rupture' },
  { icon: BedDouble,    label: 'Hospitalisations',  desc: 'Suivi des patients hospitalisés, lits' },
  { icon: BarChart3,    label: 'Rapports',          desc: 'Statistiques d\'activité, graphes mensuels' },
]

const TESTIMONIALS = [
  {
    name: 'Dr. Mamadou Diallo',
    role: 'Médecin généraliste — Conakry',
    text: 'ClinicPro nous a permis de digitaliser notre clinique en moins d\'une semaine. Plus de cahiers perdus, tout est centralisé.',
    stars: 5,
  },
  {
    name: 'Dr. Fatoumata Camara',
    role: 'Directrice — Polyclinique Harmonie',
    text: 'La gestion des rendez-vous et de la facturation est devenue beaucoup plus simple. Notre personnel l\'a adopté rapidement.',
    stars: 5,
  },
  {
    name: 'Ibrahim Kouyaté',
    role: 'Administrateur — Cabinet Médical du Fleuve',
    text: 'Les rapports statistiques nous aident à prendre de meilleures décisions. Je recommande à toutes les structures médicales.',
    stars: 5,
  },
]

const CLINIC_TYPES = [
  'Clinique générale', 'Cabinet dentaire', 'Pédiatrie', 'Maternité',
  'Ophtalmologie', 'Psychiatrie', 'Hôpital', 'Polyclinique',
]

// ── Components ───────────────────────────────────────────────────────────────

function NavBar() {
  const [open, setOpen] = useState(false)
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-gray-900 text-lg">ClinicPro</span>
        </div>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <a href="#modules"      className="hover:text-blue-600 transition-colors">Modules</a>
          <a href="#tarifs"       className="hover:text-blue-600 transition-colors">Tarifs</a>
          <a href="#temoignages"  className="hover:text-blue-600 transition-colors">Témoignages</a>
          <a href="#contact"      className="hover:text-blue-600 transition-colors">Contact</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login"
            className="text-sm font-medium text-gray-600 hover:text-blue-600 px-4 py-2 transition-colors">
            Se connecter
          </Link>
          <Link href="/auth/register"
            className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors shadow-sm">
            Essai gratuit
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 text-gray-600" onClick={() => setOpen(v => !v)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 pb-4 space-y-3">
          {['#modules', '#tarifs', '#temoignages', '#contact'].map((href, i) => (
            <a key={href} href={href} onClick={() => setOpen(false)}
              className="block py-2 text-sm text-gray-600 hover:text-blue-600">
              {['Modules', 'Tarifs', 'Témoignages', 'Contact'][i]}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
            <Link href="/auth/login" className="text-center py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl">
              Se connecter
            </Link>
            <Link href="/auth/register" className="text-center py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl">
              Essai gratuit
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <NavBar />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden bg-gradient-to-b from-blue-50/60 to-white">
        {/* Background shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-100/30 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-6">
            <Zap className="h-3.5 w-3.5" /> Nouveau — Gestion médicale 100% numérique
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight tracking-tight">
            Gérez votre clinique<br />
            <span className="text-blue-600">avec efficacité</span>
          </h1>

          <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            ClinicPro est la plateforme SaaS tout-en-un pour digitaliser votre établissement médical —
            patients, consultations, facturation, ordonnances et bien plus.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/auth/register"
              className="flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-lg shadow-blue-200 transition-all text-sm">
              Commencer gratuitement <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#modules"
              className="flex items-center gap-2 px-6 py-3.5 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl border border-gray-200 transition-all text-sm shadow-sm">
              Voir les modules <ChevronRight className="h-4 w-4" />
            </a>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Aucune carte bancaire requise · Installation en 5 minutes · Annulation à tout moment
          </p>
        </div>

        {/* Stats */}
        <div className="relative max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { value: '500+', label: 'Patients gérés' },
            { value: '9',    label: 'Modules inclus' },
            { value: '100%', label: 'Données sécurisées' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 text-center">
              <p className="text-2xl font-extrabold text-blue-600">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Compatible avec ── */}
      <section className="py-10 px-4 bg-gray-50 border-y border-gray-100">
        <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          Adapté à tous les types d'établissements
        </p>
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {CLINIC_TYPES.map(type => (
            <span key={type} className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 text-xs rounded-full shadow-sm">
              {type}
            </span>
          ))}
        </div>
      </section>

      {/* ── Modules ── */}
      <section id="modules" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 mt-3 text-base">9 modules intégrés, accessibles depuis un seul tableau de bord</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="group bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md rounded-2xl p-5 transition-all">
                <div className="w-10 h-10 bg-blue-50 group-hover:bg-blue-100 rounded-xl flex items-center justify-center mb-3 transition-colors">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">{label}</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Avantages ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Pourquoi choisir ClinicPro ?</h2>
            <p className="text-blue-200 mt-3 text-base">Conçu spécifiquement pour les établissements médicaux africains</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: Zap,    title: 'Rapide à déployer',   desc: 'Prêt en 5 minutes. Aucune installation locale requise.' },
              { icon: Lock,   title: 'Données sécurisées',  desc: 'Accès par rôles, isolation par clinique, JWT sécurisé.' },
              { icon: Globe,  title: 'Multi-utilisateurs',  desc: 'Médecin, secrétaire, comptable — chacun son accès.' },
              { icon: Shield, title: 'Multi-tenant',        desc: 'Chaque clinique a ses données isolées et privées.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/10 hover:bg-white/15 border border-white/20 rounded-2xl p-5 transition-colors">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-semibold text-white text-sm">{title}</h3>
                <p className="text-blue-200 text-xs mt-1 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tarifs ── */}
      <section id="tarifs" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Tarifs simples et transparents</h2>
            <p className="text-gray-500 mt-3 text-base">Sans frais cachés · Sans engagement · Annulable à tout moment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map((plan) => (
              <div key={plan.name}
                className={`relative bg-white rounded-2xl border-2 ${plan.color} p-6 shadow-sm flex flex-col`}>
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow">
                    {plan.badge}
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{plan.desc}</p>
                  <div className="mt-4 flex items-end gap-1">
                    {plan.currency ? (
                      <>
                        <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                        <span className="text-sm text-gray-500 mb-1">{plan.currency}{plan.period}</span>
                      </>
                    ) : (
                      <span className="text-2xl font-extrabold text-gray-900">{plan.price}</span>
                    )}
                  </div>
                </div>

                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href={plan.price === 'Sur devis' ? '#contact' : '/auth/register'}
                  className={`mt-6 block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    plan.badge
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                  {plan.price === 'Sur devis' ? 'Nous contacter' : 'Commencer l\'essai'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Témoignages ── */}
      <section id="temoignages" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Ce que disent nos clients</h2>
            <p className="text-gray-500 mt-3 text-base">Des professionnels de santé qui nous font confiance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, text, stars }) => (
              <div key={name} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed italic">"{text}"</p>
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="font-semibold text-gray-800 text-sm">{name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-10 shadow-xl shadow-blue-200">
            <Heart className="h-10 w-10 text-white/80 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white">Prêt à digitaliser votre clinique ?</h2>
            <p className="text-blue-200 mt-3 text-base">
              Rejoignez les établissements médicaux qui font confiance à ClinicPro.
            </p>
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 mt-6 px-7 py-3.5 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-2xl transition-colors shadow-lg text-sm">
              Créer ma clinique gratuitement <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-blue-300 text-xs mt-3">30 jours gratuits · Sans carte bancaire</p>
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Contactez-nous</h2>
            <p className="text-gray-500 mt-2 text-sm">Une question ? Notre équipe vous répond sous 24h</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4">
            {[
              { icon: Phone, label: 'Téléphone / WhatsApp', value: '+224 663 33 99 55' },
              { icon: Mail,  label: 'Email',                value: 'contact@maxmatechsolutions.net' },
              { icon: MapPin,label: 'Localisation',         value: 'Conakry, Guinée' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-semibold text-gray-800 whitespace-nowrap">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-4 bg-gray-900 text-gray-400 text-center text-xs">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-white text-sm">ClinicPro</span>
        </div>
        <p>© {new Date().getFullYear()} ClinicPro — Système de gestion médicale SaaS</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link href="/auth/login"    className="hover:text-white transition-colors">Connexion</Link>
          <Link href="/auth/register" className="hover:text-white transition-colors">Inscription</Link>
          <a href="#contact"          className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>
    </div>
  )
}
