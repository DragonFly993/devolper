import {
  addWalletLedgerEntry,
  createPaymentOrder,
  getPaymentOrders,
  getWalletAccount,
  getWalletLedger,
  updatePaymentOrderStatus,
  updateWalletBalance,
} from '../utils/database';

export async function getWalletOverview() {
  const [account, ledger, orders] = await Promise.all([
    getWalletAccount(),
    getWalletLedger(),
    getPaymentOrders(),
  ]);
  return { account, ledger, orders };
}

export async function markOrderPaying(orderNo) {
  return updatePaymentOrderStatus({ orderNo, status: 'paying' });
}

export async function settleOrderSuccess(order) {
  await updatePaymentOrderStatus({ orderNo: order.orderNo, status: 'success', note: '模拟支付成功' });
  if (order.direction === 'topup') {
    await updateWalletBalance({ delta: Number(order.amount) });
    await addWalletLedgerEntry({
      type: 'topup',
      amount: Number(order.amount),
      status: 'done',
      note: `${order.channel} 模拟充值`,
      orderNo: order.orderNo,
    });
  } else {
    await updateWalletBalance({ delta: -Number(order.amount) });
    await addWalletLedgerEntry({
      type: 'pay',
      amount: -Math.abs(Number(order.amount)),
      status: 'done',
      note: `${order.channel} 模拟消费`,
      orderNo: order.orderNo,
    });
  }
  await updatePaymentOrderStatus({ orderNo: order.orderNo, status: 'settled' });
}

export async function settleOrderFailed(order, reason) {
  await updatePaymentOrderStatus({
    orderNo: order.orderNo,
    status: 'failed',
    note: reason || '模拟支付失败',
  });
}

export async function createMockOrder({ amount, channel, direction, note }) {
  const orderNo = `MOCK${Date.now()}${Math.floor(Math.random() * 1000)}`;
  return createPaymentOrder({
    orderNo,
    channel,
    amount: Number(amount),
    direction,
    note: note || '',
    status: 'created',
  });
}
