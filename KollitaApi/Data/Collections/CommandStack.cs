namespace KollitaApi.Data.Collections;

public class CommandStack<T>
{
    private T[] _items;
    private int _top;
    private const int DefaultCapacity = 64;

    public int Count => _top + 1;
    public bool IsEmpty => _top < 0;

    public CommandStack() { _items = new T[DefaultCapacity]; _top = -1; }

    public void Push(T item)
    {
        if (_top + 1 >= _items.Length) Array.Resize(ref _items, _items.Length * 2);
        _items[++_top] = item;
    }

    public T Pop()
    {
        if (_top < 0) throw new InvalidOperationException("Stack is empty");
        return _items[_top--];
    }

    public T Peek()
    {
        if (_top < 0) throw new InvalidOperationException("Stack is empty");
        return _items[_top];
    }

    public bool TryPop(out T? item)
    {
        if (_top < 0) { item = default; return false; }
        item = _items[_top--];
        return true;
    }

    public T[] ToArray()
    {
        var arr = new T[_top + 1];
        Array.Copy(_items, arr, _top + 1);
        return arr;
    }

    public void Clear() => _top = -1;
}

public class UndoManager<T>
{
    private readonly CommandStack<T> _undoStack;
    private readonly CommandStack<T> _redoStack;
    public int MaxHistory { get; set; } = 50;

    public UndoManager()
    {
        _undoStack = new CommandStack<T>();
        _redoStack = new CommandStack<T>();
    }

    public void Execute(T state)
    {
        _undoStack.Push(state);
        _redoStack.Clear();
        while (_undoStack.Count > MaxHistory) _undoStack.Pop();
    }

    public T? Undo()
    {
        if (!_undoStack.TryPop(out var state)) return default;
        if (state != null) _redoStack.Push(state);
        return _undoStack.TryPop(out var prev) ? prev : default;
    }

    public T? Redo()
    {
        if (!_redoStack.TryPop(out var state)) return default;
        if (state != null) _undoStack.Push(state);
        return state;
    }

    public T? Current() => _undoStack.TryPop(out var state) ? state : default;

    public int UndoCount => _undoStack.Count;
    public int RedoCount => _redoStack.Count;
}
