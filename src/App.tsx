import React, { useState, useEffect } from 'react';
import './Calendar.css';

type Task = {
  id: number;
  date: string;
  title: string;
};

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('calendarTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('calendarTasks', JSON.stringify(tasks));
  }, [tasks]);

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const startDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleTaskClick = (task: Task) => {
    setEditingTaskId(task.id);
    setEditingTaskTitle(task.title);
  };

  const handleTaskEdit = (taskId: number) => {
    setTasks(tasks.map(task => (task.id === taskId ? { ...task, title: editingTaskTitle } : task)));
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleTaskDelete = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleCellClick = (dateString: string) => {
    if (!tasks.some(task => task.date === dateString)) {
      const newTask: Task = {
        id: Date.now(),
        date: dateString,
        title: "New Task",
      };
      setTasks([...tasks, newTask]);
      setEditingTaskId(newTask.id);
      setEditingTaskTitle(newTask.title);
    }
  };

  const renderCalendarGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInCurrentMonth = daysInMonth(year, month);
    const startDay = startDayOfMonth(year, month);

    const calendarDays = Array.from({ length: 42 }, (_, i) => {
      const dayNumber = i - startDay + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInCurrentMonth;
      const dateString = isCurrentMonth
        ? `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
        : '';

      return (
        <div
          key={i}
          className={`calendar-cell ${isCurrentMonth ? 'current-month' : 'other-month'}`}
          onClick={() => isCurrentMonth && handleCellClick(dateString)}
        >
          <div className="cell-content">
            {isCurrentMonth && dayNumber}
            {tasks
              .filter(task => task.date === dateString)
              .map(task => (
                <div
                  key={task.id}
                  className="task"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the cell click handler
                    handleTaskClick(task);
                  }}
                >
                  {editingTaskId === task.id ? (
                    <input
                      type="text"
                      value={editingTaskTitle}
                      onChange={e => setEditingTaskTitle(e.target.value)}
                      onBlur={() => handleTaskEdit(task.id)}
                    />
                  ) : (
                    <>
                      {task.title}
                      <button
                        className="delete-task"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskDelete(task.id);
                        }}
                      >
                        ✖
                      </button>
                    </>
                  )}
                </div>
              ))}
          </div>
        </div>
      );
    });

    return calendarDays;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button onClick={handlePrevMonth}>&lt;</button>
        <h2>{currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={handleNextMonth}>&gt;</button>
      </div>
      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
        {renderCalendarGrid()}
      </div>
    </div>
  );
};

export default Calendar;
