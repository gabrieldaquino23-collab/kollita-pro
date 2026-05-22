namespace KollitaApi.Data.Collections;

public class KitchenOrderQueue
{
    private readonly OrderLinkedList<PendingOrder> _orders;

    public KitchenOrderQueue()
    {
        _orders = new OrderLinkedList<PendingOrder>();
    }

    public int Count => _orders.Count;
    public bool HasOrders => !_orders.IsEmpty;

    public void AddOrder(long orderId, string branch, string client, DateTime createdAt)
    {
        _orders.Enqueue(new PendingOrder
        {
            OrderId = orderId,
            Branch = branch,
            Client = client,
            CreatedAt = createdAt
        });
    }

    public PendingOrder? GetNextOrder() => _orders.Dequeue();

    public PendingOrder? PeekNext() => _orders.Peek();

    public bool RemoveOrder(long orderId)
    {
        return _orders.Remove(new PendingOrder { OrderId = orderId },
            new OrderIdComparer());
    }

    public PendingOrder[] GetAllOrders() => _orders.ToArray();

    public List<PendingOrder> ToList() => _orders.ToList();

    private class OrderIdComparer : IEqualityComparer<PendingOrder>
    {
        public bool Equals(PendingOrder? x, PendingOrder? y) =>
            x != null && y != null && x.OrderId == y.OrderId;
        public int GetHashCode(PendingOrder obj) => obj.OrderId.GetHashCode();
    }
}

public class PendingOrder
{
    public long OrderId { get; set; }
    public string Branch { get; set; } = string.Empty;
    public string Client { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
