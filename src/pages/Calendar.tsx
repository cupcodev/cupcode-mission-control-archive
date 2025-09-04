import { useState } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { format, isSameDay, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Mock data para demonstração
const mockEvents = [
  {
    id: '1',
    title: 'Reunião de Planning',
    type: 'meeting',
    date: new Date(),
    time: '09:00',
    status: 'confirmed',
    participants: ['João Silva', 'Maria Santos']
  },
  {
    id: '2',
    title: 'Deadline: Landing Page',
    type: 'deadline',
    date: addDays(new Date(), 2),
    time: '18:00',
    status: 'pending',
    project: 'Website Redesign'
  },
  {
    id: '3',
    title: 'Aprovação: Design System',
    type: 'approval',
    date: addDays(new Date(), 1),
    time: '14:30',
    status: 'pending',
    assignee: 'Pedro Costa'
  },
  {
    id: '4',
    title: 'Release: Mobile App v2.1',
    type: 'release',
    date: addDays(new Date(), 5),
    time: '16:00',
    status: 'scheduled',
    project: 'Mobile App Update'
  }
];

const getEventTypeColor = (type: string) => {
  const typeMap = {
    meeting: 'bg-blue-500',
    deadline: 'bg-red-500',
    approval: 'bg-orange-500',
    release: 'bg-green-500'
  };
  return typeMap[type as keyof typeof typeMap] || 'bg-gray-500';
};

const getEventTypeLabel = (type: string) => {
  const typeMap = {
    meeting: 'Reunião',
    deadline: 'Prazo',
    approval: 'Aprovação',
    release: 'Release'
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed':
    case 'scheduled':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'overdue':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <CalendarDays className="h-4 w-4 text-muted-foreground" />;
  }
};

export const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth] = useState(new Date());

  // Filtrar eventos para o mês atual
  const currentMonthEvents = mockEvents.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= startOfMonth(currentMonth) && eventDate <= endOfMonth(currentMonth);
  });

  // Filtrar eventos para o dia selecionado
  const selectedDayEvents = selectedDate 
    ? mockEvents.filter(event => isSameDay(new Date(event.date), selectedDate))
    : [];

  // Eventos próximos (próximos 7 dias)
  const upcomingEvents = mockEvents
    .filter(event => {
      const eventDate = new Date(event.date);
      const today = new Date();
      const nextWeek = addDays(today, 7);
      return eventDate >= today && eventDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Marcar dias com eventos no calendário
  const getDayModifiers = () => {
    const eventDates = currentMonthEvents.map(event => new Date(event.date));
    return {
      hasEvents: eventDates
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-tomorrow font-bold">Calendário</h2>
          <p className="text-muted-foreground">
            Acompanhe prazos, reuniões e marcos importantes
          </p>
        </div>
        <Button>
          <CalendarDays className="h-4 w-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5" />
                <span>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</span>
              </CardTitle>
              <CardDescription>
                Clique em uma data para ver os eventos do dia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                modifiers={getDayModifiers()}
                modifiersStyles={{
                  hasEvents: { 
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    color: 'hsl(var(--primary))',
                    fontWeight: 'bold'
                  }
                }}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar com eventos */}
        <div className="space-y-6">
          {/* Eventos do dia selecionado */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {selectedDate 
                  ? format(selectedDate, "d 'de' MMMM", { locale: ptBR })
                  : 'Selecione uma data'
                }
              </CardTitle>
              <CardDescription>
                {selectedDayEvents.length} evento(s) neste dia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDayEvents.length > 0 ? (
                selectedDayEvents.map((event) => (
                  <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1 ${getEventTypeColor(event.type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        {getStatusIcon(event.status)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getEventTypeLabel(event.type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{event.time}</span>
                      </div>
                      {event.project && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.project}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum evento neste dia</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Próximos eventos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Próximos Eventos</CardTitle>
              <CardDescription>
                Eventos dos próximos 7 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <div className={`w-3 h-3 rounded-full mt-1 ${getEventTypeColor(event.type)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      {getStatusIcon(event.status)}
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {getEventTypeLabel(event.type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(event.date), "dd/MM")} às {event.time}
                      </span>
                    </div>
                    {event.project && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.project}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};