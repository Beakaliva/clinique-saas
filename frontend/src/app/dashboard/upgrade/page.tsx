'use client'

import { useAuthStore } from '@/store/auth.store'
import { CheckCircle2, Zap, Phone, Mail, Shield, ArrowLeft, Star } from 'lucide-react'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Starter',
    price: '150 000',
    currency: 'GNF',
    period: '/mois',
    desc: 'Idéal pour les petits cabinets',
    badge: '',
    highlight: false,
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
    badge: 'Recommandé',
    highlight: true,
    features: [
      'Utilisateurs illimités',
      'Tous les modules inclus',
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
    badge: '',
    highlight: false,
    features: [
      'Multi-sites / multi-cliniques',
      'Radiologie & hospitalisations',
      'Intégrations sur mesure',
      'Formation du personnel',
      'SLA & support 24/7',
    ],
  },
]

export default function UpgradePage() {
  const clinic = useAuthStore((s) => s.clinic)
  const daysLeft = clinic?.trial_days_left ?? 0
  const isExpired = !clinic?.trial_active && !clinic?.is_subscribed

  return (
    <div className="max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <Link href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour au dashboard
        </Link>

        {isExpired ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-red-800">Votre période d'essai est terminée</h1>
              <p className="text-sm text-red-600 mt-1">
                Vos données sont conservées. Souscrivez à un plan pour retrouver l'accès complet.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-amber-800">
                {daysLeft <= 0 ? "Votre essai expire aujourd'hui" : `Il vous reste ${daysLeft} jour${daysLeft > 1 ? 's' : ''} d'essai`}
              </h1>
              <p className="text-sm text-amber-600 mt-1">
                Choisissez votre plan pour continuer sans interruption.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-5">Choisissez votre plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map((plan) => (
            <div key={plan.name}
              className={`relative rounded-2xl border-2 p-6 flex flex-col transition-shadow
                ${plan.highlight
                  ? 'border-blue-500 shadow-lg shadow-blue-100'
                  : 'border-gray-200 shadow-sm'
                }`}>
              {plan.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
                  <Star className="h-3 w-3 fill-white" /> {plan.badge}
                </span>
              )}

              <div className="mb-4">
                <h3 className="font-bold text-gray-900 text-lg">{plan.name}</h3>
                <p className="text-gray-500 text-xs mt-0.5">{plan.desc}</p>
                <div className="mt-3 flex items-end gap-1">
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

              <ul className="space-y-2 flex-1">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>

              <a href="#contact-upgrade"
                className={`mt-5 block text-center py-2.5 rounded-xl text-sm font-semibold transition-colors
                  ${plan.highlight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}>
                {plan.price === 'Sur devis' ? 'Nous contacter' : 'Souscrire à ce plan'}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div id="contact-upgrade" className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Nous contacter pour souscrire</h2>
        <p className="text-sm text-gray-500 mb-5">
          Pour activer votre abonnement, contactez-nous par téléphone ou WhatsApp. Nous traitons votre demande sous 24h.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <a href="tel:+224620000000"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
              <Phone className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Téléphone / WhatsApp</p>
              <p className="text-sm font-semibold text-gray-800">+224 663 33 99 55</p>
            </div>
          </a>
          <a href="mailto:contact@maxmatechsolutions.net"
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
            <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Email</p>
              <p className="text-sm font-semibold text-gray-800">contact@maxmatechsolutions.net</p>
            </div>
          </a>
        </div>
      </div>

    </div>
  )
}
