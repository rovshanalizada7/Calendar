import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { GrFormNextLink, GrFormPreviousLink } from "react-icons/gr";
import { BsTrash3 } from "react-icons/bs";
import { FaCheck } from "react-icons/fa";

type Task = {
  id: number;
  date: string;
  title: string;
};

type Holiday = {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
};

const Calendar: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedTasks = localStorage.getItem('calendarTasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editingTaskTitle, setEditingTaskTitle] = useState<string>('');
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('calendarTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const fetchHolidays = async () => {
      const countryCode = "UA"; //We can replace here with the desired country code so i have choosen Ukraine holidays
      try {
        const response = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${selectedYear}/${countryCode}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch holidays.");
        }
        const data = await response.json();
        setHolidays(data);
      } catch (error) {
        console.error("Error fetching holidays:", error);
      }
    };
    fetchHolidays();
  }, [selectedYear]);

  const daysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const startDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedYear(selectedYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedYear(selectedYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(Number(e.target.value));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(Number(e.target.value));
  };

  const handleCellClick = (dateString: string) => {
    const existingTask = tasks.find(task => task.date === dateString);

    if (!existingTask) {
      const newTask: Task = {
        id: Date.now(),
        date: dateString,
        title: "New Task",
      };

      setTasks([...tasks, newTask]);
      setEditingTaskId(newTask.id);
      setEditingTaskTitle(newTask.title);
    } else {
      setEditingTaskId(existingTask.id);
      setEditingTaskTitle(existingTask.title);
    }
  };

  const handleTaskEdit = (taskId: number) => {
    if (editingTaskTitle.trim() === '') {
      alert('Task title cannot be empty!');
      setEditingTaskId(null);
      setEditingTaskTitle('');
      return;
    }

    setTasks(tasks.map(task => (task.id === taskId ? { ...task, title: editingTaskTitle } : task)));
    setEditingTaskId(null);
    setEditingTaskTitle('');
  };

  const handleTaskDelete = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleDragStart = (taskId: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDragOverCell = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDropOnCell = (dateString: string) => (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'), 10);
    setTasks(tasks.map(task => (task.id === taskId ? { ...task, date: dateString } : task)));
    setDraggedTaskId(null);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCalendarGrid = () => {
    const daysInCurrentMonth = daysInMonth(selectedYear, selectedMonth);
    const startDay = startDayOfMonth(selectedYear, selectedMonth);

    const calendarDays = Array.from({ length: 42 }, (_, i) => {
      const dayNumber = i - startDay + 1;
      const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInCurrentMonth;
      const dateString = isCurrentMonth
        ? `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
        : '';

      const holiday = holidays.find(h => h.date === dateString);

      return (
        <div
          key={i}
          className={`calendar-cell ${isCurrentMonth ? 'current-month' : 'other-month'}`}
          onClick={() => isCurrentMonth && handleCellClick(dateString)}
          onDragOver={handleDragOverCell}
          onDrop={isCurrentMonth ? handleDropOnCell(dateString) : undefined}
        >
          <div className="cell-content">
            {isCurrentMonth && dayNumber}
            {holiday && <div className="holiday-name">{holiday.localName}</div>}
            {filteredTasks
              .filter(task => task.date === dateString)
              .map(task => (
                <div
                  key={task.id}
                  className="task"
                  draggable
                  onDragStart={handleDragStart(task.id)}
                >
                  {editingTaskId === task.id ? (
                    <>
                      <input
                        type="text"
                        className="text-input"
                        value={editingTaskTitle}
                        onChange={(e) => setEditingTaskTitle(e.target.value)}
                        onBlur={() => handleTaskEdit(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleTaskEdit(task.id);
                          }
                        }}
                      />
                      <FaCheck
                        className="save-task-icon"
                        onClick={() => handleTaskEdit(task.id)}
                      />
                    </>
                  ) : (
                    <>
                      <div>{task.title}</div>
                      <BsTrash3
                        className="delete-task"
                        onClick={() => handleTaskDelete(task.id)}
                      />
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
        <GrFormPreviousLink onClick={handlePrevMonth} className="prev-btn" />
        <h2>
          {selectedYear} - {new Date(selectedYear, selectedMonth).toLocaleDateString('default', {
            month: 'long',
          })}
        </h2>
        <GrFormNextLink onClick={handleNextMonth} className="next-btn" />

        <div className="calendar-options">
          <select value={selectedYear} onChange={handleYearChange} className='select-date'>
            {Array.from({ length: 20 }, (_, i) => currentYear - 10 + i).map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          <select value={selectedMonth} onChange={handleMonthChange} className='select-date'>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(0, i).toLocaleDateString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search tasks..."
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="task-search"
      />

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


