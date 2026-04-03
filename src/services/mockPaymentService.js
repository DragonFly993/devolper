import {
  createMockOrder,
  markOrderPaying,
  settleOrderFailed,
  settleOrderSuccess,
} from './walletService';

function randomSuccess() {
  return Math.random() >= 0.15;
}

export async function startMockPayment({ amount, channel, direction, note }) {
  const order = await createMockOrder({ amount, channel, direction, note });
  const normalized = {
    orderNo: order.order_no || order.orderNo,
    amount: order.amount,
    channel: order.channel,
    direction: order.direction,
  };
  await markOrderPaying(normalized.orderNo);
  await new Promise((resolve) => setTimeout(resolve, 1200));
  if (randomSuccess()) {
    await settleOrderSuccess(normalized);
    return { ok: true, orderNo: normalized.orderNo };
  }
  await settleOrderFailed(normalized, '模拟网关返回失败');
  return { ok: false, orderNo: normalized.orderNo, error: 'SIMULATED_FAILED' };
}
