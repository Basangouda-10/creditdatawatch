/**
 * Subscription service - Handle subscription purchases and status
 */

import { api } from './api/apiClient'

export async function purchaseSubscription(planId) {
  /**
   * Purchase a subscription plan
   * @param {string} planId - Plan ID to purchase
   * @returns {Promise<{ok: boolean, error?: string, data?: object}>}
   */
  try {
    const response = await api.post('/subscriptions', {
      plan_id: planId,
    })

    return {
      ok: response.ok,
      error: response.ok ? null : response.data?.detail,
      data: response.data?.data,
    }
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to purchase subscription',
      data: null,
    }
  }
}

export async function getSubscriptionStatus() {
  /**
   * Get current subscription status
   * @returns {Promise<{ok: boolean, error?: string, data?: object}>}
   */
  try {
    const response = await api.get('/subscriptions/status')

    return {
      ok: response.ok,
      error: response.ok ? null : response.data?.detail,
      data: response.data?.data,
    }
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to get subscription status',
      data: null,
    }
  }
}

export async function getSubscriptionDetails(subscriptionId) {
  /**
   * Get subscription details by ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<{ok: boolean, error?: string, data?: object}>}
   */
  try {
    const response = await api.get(`/subscriptions/${subscriptionId}`)

    return {
      ok: response.ok,
      error: response.ok ? null : response.data?.detail,
      data: response.data?.data,
    }
  } catch (error) {
    return {
      ok: false,
      error: error.message || 'Failed to get subscription details',
      data: null,
    }
  }
}

export default {
  purchaseSubscription,
  getSubscriptionStatus,
  getSubscriptionDetails,
}
