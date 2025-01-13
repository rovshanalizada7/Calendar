import React, { useState, useEffect } from 'react';
import './Calendar.css';
import { GrFormNextLink } from "react-icons/gr";
import { GrFormPreviousLink } from "react-icons/gr";
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
  const [currentDate, setCurrentDate] = useState(new Date());
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
      const year = currentDate.getFullYear();
      const countryCode = "UA"; // Replace with the desired country code
      try {
        const response = await fetch(
          `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`
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
  }, [currentDate]);

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

  // const handleTaskClick = (task: Task) => {
  //   setEditingTaskId(task.id);
  //   setEditingTaskTitle(task.title);
  // };

  const handleTaskEdit = (taskId: number) => {
    if (editingTaskTitle.trim() === '') {
      alert('Task title cannot be empty!');
      // Reset editing state
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
  

  const handleDragStart = (taskId: number) => (e: React.DragEvent<HTMLDivElement>) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDragOverCell = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Allow drop
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
                      onClick={() => handleTaskEdit(task.id)} />
                    </>
                  ) : (
                    <>
                      <div>{task.title}</div>
                      <BsTrash3
                      className="delete-task"
                      onClick={() => handleTaskDelete(task.id)} />
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
        <h2>{currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}</h2>
        <GrFormNextLink onClick={handleNextMonth} className="next-btn" />
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



