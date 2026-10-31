import React, { useState } from 'react';
import { 
  X, Check, Sparkles, Shield, Zap, Package, 
  Clock, ArrowRight, Loader2, Award, ChevronRight,
  TrendingUp, Building2, Layers
} from 'lucide-react';
import { 
  SUBSCRIPTION_PLANS, 
  SubscriptionPlan, 
  UserSubscriptionState, 
  getSavedSubscription, 
  isSubscriptionActive,
  ORDER_PORTAL_MIN_PLAN_AMOUNT 
} from '../../lib/subscriptionPlans';
import { initiateRazorpayRecharge } from '../../lib/razorpayService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: { email: string; name: string; balance: number; id?: string } | null;
  onUserUpdate: (updatedUser: any) => void;
  onOpenLogin?: () => void;
  defaultTab?: 'monthly' | 'quarterly' | 'spot';
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserUpdate,
  onOpenLogin,
  defaultTab = 'monthly'
}) => {
  const [planType, setPlanType] = useState<'monthly' | 'quarterly' | 'spot'>(defaultTab);
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('500');
  const [customLoading, setCustomLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeSub: UserSubscriptionState | null = getSavedSubscription();
  const hasActiveSub = isSubscriptionActive(activeSub);

  const filteredPlans = SUBSCRIPTION_PLANS.filter(p => {
    if (planType === 'monthly') return p.type === 'monthly';
    if (planType === 'quarterly') return p.type === 'quarterly';
    if (planType === 'spot') return p.type === 'spot';
    return true;
  });

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!currentUser) {
      onClose();
      if (onOpenLogin) onOpenLogin();
      return;
    }

    if (plan.upfront === 0) {
      // On-the-spot mode
      setSuccessMessage(`Switched to On-the-spot plan (₹${plan.rateWithTag}/pc tag, ₹${plan.rateWithoutTag}/pc standard). Pay per export.`);
      setTimeout(() => setSuccessMessage(null), 4000);
      return;
    }

    setProcessingPlanId(plan.id);
    setErrorMessage(null);

    try {
      await initiateRazorpayRecharge({
        amount: plan.upfront,
        currentUser,
        plan,
        onSuccess: (newBalance) => {
          setProcessingPlanId(null);
          const updatedUser = {
            ...currentUser,
            balance: newBalance,
            planId: plan.id,
            planName: plan.name,
            planAmount: plan.upfront,
            planExpiresAt: new Date(Date.now() + plan.validityDays * 86400000).toISOString(),
            hasOrderAccess: plan.hasOrderPortalAccess
          };
          onUserUpdate(updatedUser);
          setSuccessMessage(`🎉 Activated ${plan.name}! ₹${plan.upfront.toLocaleString('en-IN')} added to your wallet.`);
          setTimeout(() => {
            setSuccessMessage(null);
            onClose();
          }, 2500);
        },
        onError: (err) => {
          setProcessingPlanId(null);
          setErrorMessage(err || 'Payment was not completed.');
        },
        onDismiss: () => {
          setProcessingPlanId(null);
        }
      });
    } catch (err: any) {
      setProcessingPlanId(null);
      setErrorMessage(err.message || 'Payment initiation failed.');
    }
  };

  const handleCustomRecharge = async () => {
    const amt = parseFloat(customAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setErrorMessage('Please enter a valid amount (minimum ₹1).');
      return;
    }
    if (amt > 50000) {
      setErrorMessage('Maximum wallet recharge limit is ₹50,000/-.');
      return;
    }
    if (!currentUser) {
      onClose();
      if (onOpenLogin) onOpenLogin();
      return;
    }

    setCustomLoading(true);
    setErrorMessage(null);

    try {
      await initiateRazorpayRecharge({
        amount: amt,
        currentUser,
        onSuccess: (newBalance) => {
          setCustomLoading(false);
          const updatedUser = { ...currentUser, balance: newBalance };
          onUserUpdate(updatedUser);
          setSuccessMessage(`✅ Added ₹${amt.toLocaleString('en-IN')} to your wallet. New balance: ₹${newBalance.toFixed(2)}.`);
          setTimeout(() => {
            setSuccessMessage(null);
            onClose();
          }, 2000);
        },
        onError: (err) => {
          setCustomLoading(false);
          setErrorMessage(err || 'Payment was not completed.');
        },
        onDismiss: () => {
          setCustomLoading(false);
        }
      });
    } catch (err: any) {
      setCustomLoading(false);
      setErrorMessage(err.message || 'Could not connect to payment gateway.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(9, 13, 22, 0.82)',
      backdropFilter: 'blur(10px)',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1080px',
          background: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 40px rgba(228, 87, 46, 0.15)',
          color: '#F8FAFC',
          position: 'relative',
          overflow: 'hidden',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Accent Gradient Bar */}
        <div style={{
          height: '4px',
          width: '100%',
          background: 'linear-gradient(90deg, #E4572E 0%, #F59E0B 50%, #10B981 100%)'
        }} />

        {/* Modal Header */}
        <div style={{
          padding: '24px 28px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #E4572E 0%, #EA580C 100%)',
                padding: '6px',
                borderRadius: '9px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 2px 8px rgba(228, 87, 46, 0.4)'
              }}>
                <Award size={20} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', margin: 0, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                FiveNest Subscription & Recharge Plans
              </h2>
              <span style={{
                fontSize: '11px',
                fontWeight: '800',
                background: 'rgba(228, 87, 46, 0.15)',
                color: '#FF7A50',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid rgba(228, 87, 46, 0.3)'
              }}>
                100% Upfront Added to Wallet
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
              Lock in lower sublimation rendering rates (as low as <strong>₹2.00/pc</strong>) and unlock <strong>Order Portal Access</strong> on plans ₹2,500+.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#94A3B8',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FFFFFF'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'; }}
          >
            <X size={18} />
          </button>
        </div>

        {/* User Account / Current Status Strip */}
        <div style={{
          padding: '12px 28px',
          background: 'rgba(15, 23, 42, 0.6)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {currentUser ? (
              <>
                <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
                  Signed in as: <strong style={{ color: '#FFFFFF' }}>{currentUser.name}</strong> ({currentUser.email})
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '800',
                  color: '#34D399'
                }}>
                  <span>Wallet:</span>
                  <span>₹{currentUser.balance.toFixed(2)} INR</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '12px', color: '#F59E0B' }}>
                ⚠️ Not signed in. Sign in to link your recharge and activate plans.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {hasActiveSub && activeSub ? (
              <div style={{
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '800',
                color: '#FBBF24',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Sparkles size={13} />
                <span>Active Plan: {activeSub.planName} (₹{activeSub.rateWithTag}/pc tag)</span>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '11px',
                color: '#94A3B8'
              }}>
                Default Rate: <strong>₹3.50/pc tag</strong> (or ₹5.50 standard)
              </div>
            )}
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div style={{
            margin: '12px 28px 0',
            padding: '10px 14px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '10px',
            color: '#F87171',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div style={{
            margin: '12px 28px 0',
            padding: '10px 14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '10px',
            color: '#34D399',
            fontSize: '12px',
            fontWeight: '700'
          }}>
            {successMessage}
          </div>
        )}

        {/* Tabs Controls */}
        <div style={{
          padding: '18px 28px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              onClick={() => setPlanType('monthly')}
              style={{
                padding: '8px 18px',
                borderRadius: '9px',
                border: 'none',
                background: planType === 'monthly' ? '#E4572E' : 'transparent',
                color: planType === 'monthly' ? '#FFFFFF' : '#94A3B8',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Clock size={14} /> Monthly Plans (30 Days)
            </button>
            <button
              onClick={() => setPlanType('quarterly')}
              style={{
                padding: '8px 18px',
                borderRadius: '9px',
                border: 'none',
                background: planType === 'quarterly' ? '#E4572E' : 'transparent',
                color: planType === 'quarterly' ? '#FFFFFF' : '#94A3B8',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Layers size={14} /> Quarterly Plans (90 Days)
            </button>
            <button
              onClick={() => setPlanType('spot')}
              style={{
                padding: '8px 18px',
                borderRadius: '9px',
                border: 'none',
                background: planType === 'spot' ? '#E4572E' : 'transparent',
                color: planType === 'spot' ? '#FFFFFF' : '#94A3B8',
                fontSize: '12px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Zap size={14} /> On-the-spot (Per Job)
            </button>
          </div>

          <div style={{ fontSize: '11px', color: '#94A3B8' }}>
            🔒 Instant Razorpay Checkout • Auto-credits wallet • Cancel anytime
          </div>
        </div>

        {/* Plans Grid (Scrollable) */}
        <div style={{
          padding: '12px 28px 24px',
          overflowY: 'auto',
          flex: 1
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: planType === 'spot' ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '16px'
          }}>
            {filteredPlans.map((plan) => {
              const isCurrent = activeSub?.planId === plan.id && hasActiveSub;
              const isPopular = Boolean(plan.isPopular);
              const isProcessing = processingPlanId === plan.id;
              const unlocksOrderPortal = plan.hasOrderPortalAccess;

              return (
                <div
                  key={plan.id}
                  style={{
                    background: isPopular 
                      ? 'linear-gradient(180deg, rgba(228, 87, 46, 0.12) 0%, rgba(15, 23, 42, 0.95) 100%)' 
                      : 'rgba(30, 41, 59, 0.45)',
                    border: isPopular 
                      ? '2px solid #E4572E' 
                      : isCurrent 
                        ? '2px solid #10B981' 
                        : '1px solid rgba(255, 255, 255, 0.09)',
                    borderRadius: '16px',
                    padding: '20px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    boxShadow: isPopular ? '0 10px 30px -10px rgba(228, 87, 46, 0.3)' : 'none'
                  }}
                >
                  {/* Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    {isPopular && (
                      <span style={{
                        background: 'linear-gradient(135deg, #E4572E 0%, #EA580C 100%)',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: '900',
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.05em'
                      }}>
                        ⭐ Recommended
                      </span>
                    )}
                    {isCurrent && (
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34D399',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '6px'
                      }}>
                        Current Plan
                      </span>
                    )}
                    <span style={{
                      fontSize: '11px',
                      color: '#94A3B8',
                      marginLeft: 'auto',
                      fontWeight: '700'
                    }}>
                      {plan.validityLabel}
                    </span>
                  </div>

                  {/* Plan Name & Upfront Price */}
                  <h3 style={{ fontSize: '17px', fontWeight: '900', margin: '0 0 6px', color: '#FFFFFF' }}>
                    {plan.name}
                  </h3>
                  
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '28px', fontWeight: '900', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                      {plan.upfront === 0 ? 'Pay As You Go' : `₹${plan.upfront.toLocaleString('en-IN')}`}
                    </span>
                    {plan.upfront > 0 && (
                      <span style={{ fontSize: '12px', color: '#94A3B8', fontWeight: '600' }}>
                        upfront
                      </span>
                    )}
                  </div>

                  {/* Jersey Rates Matrix */}
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.35)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#CBD5E1' }}>With FiveNest Tag:</span>
                      <strong style={{ fontSize: '13px', color: '#10B981' }}>
                        ₹{plan.rateWithTag.toFixed(2)}/pc
                      </strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Yield with Tag:</span>
                      <span style={{ color: '#F1F5F9', fontWeight: '700' }}>
                        {typeof plan.jerseysWithTag === 'number' ? `~${plan.jerseysWithTag.toLocaleString('en-IN')} jerseys` : plan.jerseysWithTag}
                      </span>
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', margin: '2px 0' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#CBD5E1' }}>Without Tag:</span>
                      <strong style={{ fontSize: '13px', color: '#F59E0B' }}>
                        ₹{plan.rateWithoutTag.toFixed(2)}/pc
                      </strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Yield without Tag:</span>
                      <span style={{ color: '#F1F5F9', fontWeight: '700' }}>
                        {typeof plan.jerseysWithoutTag === 'number' ? `~${plan.jerseysWithoutTag.toLocaleString('en-IN')} jerseys` : plan.jerseysWithoutTag}
                      </span>
                    </div>
                  </div>

                  {/* Order Portal Access Badge */}
                  <div style={{
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: unlocksOrderPortal ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: unlocksOrderPortal ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <Package size={16} style={{ color: unlocksOrderPortal ? '#34D399' : '#64748B', flexShrink: 0 }} />
                    <div style={{ fontSize: '11px', lineHeight: 1.3 }}>
                      {unlocksOrderPortal ? (
                        <>
                          <strong style={{ color: '#34D399', display: 'block' }}>Order Portal Included</strong>
                          <span style={{ color: '#94A3B8' }}>Manufacturing sheets, factory ledgers & orders</span>
                        </>
                      ) : (
                        <span style={{ color: '#64748B' }}>
                          Order Portal not included (Requires ₹2,500+ plan)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div style={{ flex: 1, marginBottom: '18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {plan.features.map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '11px', color: '#CBD5E1' }}>
                          <Check size={12} style={{ color: isPopular ? '#E4572E' : '#10B981', flexShrink: 0 }} />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isProcessing}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '11px',
                      border: 'none',
                      background: isPopular
                        ? 'linear-gradient(135deg, #E4572E 0%, #EA580C 100%)'
                        : isCurrent
                          ? 'rgba(16, 185, 129, 0.2)'
                          : 'rgba(255, 255, 255, 0.08)',
                      color: isCurrent && !isPopular ? '#34D399' : '#FFFFFF',
                      fontSize: '13px',
                      fontWeight: '800',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: isPopular ? '0 4px 15px rgba(228, 87, 46, 0.4)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Opening Razorpay...</span>
                      </>
                    ) : plan.upfront === 0 ? (
                      <>
                        <span>Use On-the-spot</span>
                        <ChevronRight size={14} />
                      </>
                    ) : (
                      <>
                        <span>{isCurrent ? 'Renew' : 'Recharge'} ₹{plan.upfront.toLocaleString('en-IN')}</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Custom Wallet Topup Section */}
          <div style={{
            marginTop: '24px',
            background: 'rgba(30, 41, 59, 0.35)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '800', color: '#FFFFFF', marginBottom: '3px' }}>
                💳 Or Enter Any Custom Wallet Top-up
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Add credits directly to your wallet for on-the-spot exports (Default rate ₹3.50/pc tag, ₹5.50 standard).
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#E4572E', fontWeight: '800' }}>₹</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="500"
                  style={{
                    width: '120px',
                    padding: '8px 10px 8px 24px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    fontWeight: '700',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                onClick={handleCustomRecharge}
                disabled={customLoading}
                style={{
                  padding: '9px 18px',
                  background: '#E4572E',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '800',
                  cursor: customLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {customLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                <span>Top-up Wallet</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};
