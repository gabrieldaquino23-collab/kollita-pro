namespace KollitaApi.Data.Collections;

public class OrderNode<T>
{
    public T Data { get; set; }
    public OrderNode<T>? Next { get; set; }
    public OrderNode<T>? Prev { get; set; }

    public OrderNode(T data)
    {
        Data = data;
        Next = null;
        Prev = null;
    }
}

public class OrderLinkedList<T> : IEnumerable<T>
{
    private OrderNode<T>? _head;
    private OrderNode<T>? _tail;
    private int _count;

    public int Count => _count;
    public OrderNode<T>? Head => _head;
    public OrderNode<T>? Tail => _tail;
    public bool IsEmpty => _count == 0;

    public void Enqueue(T item)
    {
        var node = new OrderNode<T>(item);
        if (_tail == null)
        {
            _head = _tail = node;
        }
        else
        {
            _tail.Next = node;
            node.Prev = _tail;
            _tail = node;
        }
        _count++;
    }

    public T? Dequeue()
    {
        if (_head == null) return default;
        var data = _head.Data;
        _head = _head.Next;
        if (_head != null) _head.Prev = null;
        else _tail = null;
        _count--;
        return data;
    }

    public T? Peek() => _head != null ? _head.Data : default;

    public bool Remove(T item, IEqualityComparer<T>? comparer = null)
    {
        comparer ??= EqualityComparer<T>.Default;
        var current = _head;
        while (current != null)
        {
            if (comparer.Equals(current.Data, item))
            {
                if (current.Prev != null) current.Prev.Next = current.Next;
                else _head = current.Next;
                if (current.Next != null) current.Next.Prev = current.Prev;
                else _tail = current.Prev;
                _count--;
                return true;
            }
            current = current.Next;
        }
        return false;
    }

    public T[] ToArray()
    {
        var arr = new T[_count];
        var current = _head;
        var i = 0;
        while (current != null) { arr[i++] = current.Data; current = current.Next; }
        return arr;
    }

    public List<T> ToList()
    {
        var list = new List<T>(_count);
        var current = _head;
        while (current != null) { list.Add(current.Data); current = current.Next; }
        return list;
    }

    public IEnumerator<T> GetEnumerator()
    {
        var current = _head;
        while (current != null) { yield return current.Data; current = current.Next; }
    }

    System.Collections.IEnumerator System.Collections.IEnumerable.GetEnumerator() => GetEnumerator();
}
