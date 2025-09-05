import { useState, useEffect } from 'react';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { format, isSameDay, addDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EventCreateDialog } from '@/components/workflows/EventCreateDialog';
import { supabase } from '@/integrations/supabase/client';

interface CalendarEvent {
  event_id: string;
  event_type: string;
  task_id: string;
  instance_id: string;
  client_id: string;
  service_id: string;
  title: string;
  start_at: string;
  end_at: string;
  all_day: boolean;
  assignee_user_id?: string;
  assigned_role?: string;
  status: string;
  task_type: string;
  created_at: string;
}

const getEventTypeColor = (type: string) => {
  const typeMap = {
    task_due: 'bg-blue-500',
    approval_pending: 'bg-orange-500',
    milestone: 'bg-green-500'
  };
  return typeMap[type as keyof typeof typeMap] || 'bg-gray-500';
};

const getEventTypeLabel = (type: string) => {
  const typeMap = {
    task_due: 'Prazo de Tarefa',
    approval_pending: 'Aprovação Pendente',
    milestone: 'Marco'
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'done':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'open':
    case 'in_progress':
      return <Clock className="h-4 w-4 text-orange-500" />;
    case 'blocked':
    case 'rejected':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <CalendarDays className="h-4 w-4 text-muted-foreground" />;
  }
};

export const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth] = useState(new Date());
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .schema('mc')
        .from('v_calendar_events')
        .select('*')
        .order('start_at', { ascending: true });

      if (error) {
        console.error('Error loading calendar events:', error);
        setEvents([]);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar eventos para o mês atual
  const currentMonthEvents = events.filter(event => {
    const eventDate = new Date(event.start_at);
    return eventDate >= startOfMonth(currentMonth) && eventDate <= endOfMonth(currentMonth);
  });

  // Filtrar eventos para o dia selecionado
  const selectedDayEvents = selectedDate 
    ? events.filter(event => isSameDay(new Date(event.start_at), selectedDate))
    : [];

  // Eventos próximos (próximos 7 dias)
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.start_at);
      const today = new Date();
      const nextWeek = addDays(today, 7);
      return eventDate >= today && eventDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());

  // Marcar dias com eventos no calendário
  const getDayModifiers = () => {
    const eventDates = currentMonthEvents.map(event => new Date(event.start_at));
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
        <Button onClick={() => setEventDialogOpen(true)}>
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
                  <div key={event.event_id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1 ${getEventTypeColor(event.event_type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        {getStatusIcon(event.status)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.start_at), 'HH:mm')}
                        </span>
                      </div>
                      {event.assigned_role && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Função: {event.assigned_role}
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
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div key={event.event_id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className={`w-3 h-3 rounded-full mt-1 ${getEventTypeColor(event.event_type)}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        {getStatusIcon(event.status)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {getEventTypeLabel(event.event_type)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(event.start_at), "dd/MM 'às' HH:mm")}
                        </span>
                      </div>
                      {event.assigned_role && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Função: {event.assigned_role}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarDays className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum evento próximo</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <EventCreateDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        onEventCreated={loadEvents}
      />
    </div>
  );
};