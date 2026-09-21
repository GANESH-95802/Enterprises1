const Subscription = require('../../models/Subscription');
const Invoice = require('../../models/Invoice');
const Organization = require('../../models/Organization');
const organizationService = require('./organizationService');

/**
 * Subscription & Billing Service
 * Manages subscription plans, billing lifecycle, and invoice generation.
 * Payment gateway ready architecture.
 */
class SubscriptionService {
  constructor() {
    this.planPrices = {
      free: 0,
      professional: 49,
      enterprise: 199,
    };
  }

  /**
   * Get current subscription for an organization
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Subscription
   */
  async getSubscription(organizationId) {
    try {
      const subscription = await Subscription.findOne({ organizationId });
      if (!subscription) {
        return { success: false, message: 'No subscription found', statusCode: 404 };
      }
      return { success: true, data: { subscription: this._serialize(subscription) } };
    } catch (error) {
      console.error('Subscription service - get error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Upgrade or change subscription plan
   * @param {string} organizationId - Organization ID
   * @param {string} plan - Plan name (free, professional, enterprise)
   * @param {Object} options - { billingCycle, actor }
   * @returns {Promise<Object>} - Updated subscription
   */
  async changePlan(organizationId, plan, options = {}) {
    try {
      if (!['free', 'professional', 'enterprise'].includes(plan)) {
        return { success: false, message: 'Invalid plan' };
      }

      let subscription = await Subscription.findOne({ organizationId });
      if (!subscription) {
        subscription = await Subscription.create({
          organizationId,
          plan: 'free',
          status: 'active',
          startDate: new Date(),
          usageLimits: organizationService.getPlanLimits('free'),
          features: organizationService.getPlans().free.features,
          price: 0,
        });
      }

      const planDef = organizationService.getPlans()[plan];
      const billingCycle = options.billingCycle || subscription.billingCycle || 'monthly';
      const now = new Date();
      const expiryDate = billingCycle === 'yearly'
        ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
        : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const oldPlan = subscription.plan;
      subscription.plan = plan;
      subscription.status = plan === 'free' ? 'active' : 'active';
      subscription.billingCycle = billingCycle;
      subscription.price = this.planPrices[plan];
      subscription.expiryDate = plan === 'free' ? null : expiryDate;
      subscription.usageLimits = planDef.usageLimits;
      subscription.features = planDef.features;
      subscription.paymentStatus = plan === 'free' ? 'unpaid' : 'pending';
      if (plan !== 'free') {
        subscription.trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      }
      await subscription.save();

      // Update organization reference
      await Organization.updateOne(
        { _id: organizationId },
        { subscriptionPlan: plan, usageLimits: planDef.usageLimits }
      );

      // Generate invoice for paid plans
      if (plan !== 'free' && oldPlan !== plan) {
        await this.generateInvoice(organizationId, {
          plan,
          billingCycle,
          amount: this.planPrices[plan],
        });
      }

      return {
        success: true,
        data: { subscription: this._serialize(subscription) },
        message: `Subscription updated to ${plan}`,
      };
    } catch (error) {
      console.error('Subscription service - change plan error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Cancel subscription
   * @param {string} organizationId - Organization ID
   * @returns {Promise<Object>} - Result
   */
  async cancelSubscription(organizationId) {
    try {
      const subscription = await Subscription.findOne({ organizationId });
      if (!subscription) return { success: false, message: 'No subscription found', statusCode: 404 };

      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
      await subscription.save();

      return { success: true, message: 'Subscription canceled' };
    } catch (error) {
      console.error('Subscription service - cancel error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate an invoice for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} data - { plan, billingCycle, amount }
   * @returns {Promise<Object>} - Invoice
   */
  async generateInvoice(organizationId, data = {}) {
    try {
      const count = await Invoice.countDocuments();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
      const amount = data.amount || this.planPrices[data.plan] || 0;
      const taxAmount = Math.round(amount * 0.1 * 100) / 100; // 10% tax
      const now = new Date();

      const invoice = await Invoice.create({
        organizationId,
        invoiceNumber,
        status: 'pending',
        amount,
        currency: 'USD',
        taxAmount,
        totalAmount: amount + taxAmount,
        billingPeriod: {
          start: now,
          end: data.billingCycle === 'yearly'
            ? new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())
            : new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
        },
        items: [{
          description: `${data.plan} plan subscription (${data.billingCycle || 'monthly'})`,
          quantity: 1,
          unitPrice: amount,
          amount,
        }],
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        paymentMethod: 'none',
        paymentGateway: '',
        paymentReference: '',
      });

      return { success: true, data: { invoice: this._serializeInvoice(invoice) } };
    } catch (error) {
      console.error('Subscription service - generate invoice error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * List invoices for an organization
   * @param {string} organizationId - Organization ID
   * @param {Object} options - { status, limit, skip }
   * @returns {Promise<Object>} - Invoices
   */
  async listInvoices(organizationId, options = {}) {
    try {
      const query = { organizationId };
      if (options.status) query.status = options.status;

      const limit = Math.min(options.limit || 20, 50);
      const skip = options.skip || 0;

      const [invoices, total] = await Promise.all([
        Invoice.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Invoice.countDocuments(query),
      ]);

      return {
        success: true,
        data: {
          invoices: invoices.map((i) => this._serializeInvoice(i)),
          total,
          limit,
          skip,
        },
      };
    } catch (error) {
      console.error('Subscription service - list invoices error:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Get platform plans for pricing page
   */
  getPlans() {
    return organizationService.getPlans();
  }

  _serialize(sub) {
    return {
      id: sub._id,
      organizationId: sub.organizationId,
      plan: sub.plan,
      status: sub.status,
      startDate: sub.startDate,
      expiryDate: sub.expiryDate,
      trialEndsAt: sub.trialEndsAt,
      paymentStatus: sub.paymentStatus,
      paymentMethod: sub.paymentMethod,
      billingCycle: sub.billingCycle,
      price: sub.price,
      currency: sub.currency,
      usageLimits: sub.usageLimits,
      features: sub.features,
      canceledAt: sub.canceledAt,
      createdAt: sub.createdAt,
      updatedAt: sub.updatedAt,
    };
  }

  _serializeInvoice(inv) {
    return {
      id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      status: inv.status,
      amount: inv.amount,
      currency: inv.currency,
      taxAmount: inv.taxAmount,
      totalAmount: inv.totalAmount,
      billingPeriod: inv.billingPeriod,
      items: inv.items,
      dueDate: inv.dueDate,
      paidAt: inv.paidAt,
      createdAt: inv.createdAt,
    };
  }
}

// Export singleton
const subscriptionService = new SubscriptionService();
module.exports = subscriptionService;
module.exports.SubscriptionService = SubscriptionService;