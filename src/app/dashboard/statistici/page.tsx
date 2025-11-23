"use client";

import { useEffect, useState } from "react";
import { useAuth, isAdmin } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Users,
  GraduationCap,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { useSupabaseBrowser } from "@/utils/supabase/client";
import {
  useResourcesCrud,
  useUsersCrud,
  useGroupsCrud,
} from "@/hooks/use-controllers";
import { HighchartsWrapper } from "@/components/charts/HighchartsWrapper";

const MetricCard = ({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-600">
        {title}
      </CardTitle>
      <Icon className={`h-4 w-4 ${color}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

export default function StatisticiPage() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useSupabaseBrowser();
  const [mounted, setMounted] = useState(false);

  // Get counts from controllers
  const { useCount: useResourcesCount } = useResourcesCrud();
  const { useCount: useUsersCount } = useUsersCrud();
  const { useCount: useGroupsCount } = useGroupsCrud();

  const resourcesCount = useResourcesCount();
  const usersCount = useUsersCount();
  const groupsCount = useGroupsCount();

  // State for real data
  const [usersByRole, setUsersByRole] = useState<any[]>([]);
  const [resourcesByStatus, setResourcesByStatus] = useState<any[]>([]);
  const [resourcesOverTime, setResourcesOverTime] = useState<any[]>([]);
  const [usersOverTime, setUsersOverTime] = useState<any[]>([]);
  const [topDisciplines, setTopDisciplines] = useState<any[]>([]);
  const [topAuthors, setTopAuthors] = useState<any[]>([]);
  const [topGroups, setTopGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && mounted) {
      if (!user || !isAdmin(user, profile)) {
        router.push("/dashboard");
      } else {
        fetchStatistics();
      }
    }
  }, [user, profile, authLoading, mounted]);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Fetch users by role
      const { data: users } = await supabase.from("users").select("role");

      if (users) {
        const roleCounts = users.reduce((acc: any, user: any) => {
          const role = user.role || "STUDENT";
          acc[role] = (acc[role] || 0) + 1;
          return acc;
        }, {});

        const roleColors: any = {
          STUDENT: "#3b82f6",
          FORMATOR: "#8b5cf6",
          EVALUATOR: "#f59e0b",
          ADMINISTRATOR: "#ef4444",
          MODERATOR: "#10b981",
        };

        const roleLabels: any = {
          STUDENT: "Student",
          FORMATOR: "Formator",
          EVALUATOR: "Evaluator",
          ADMINISTRATOR: "Admin",
          MODERATOR: "Moderator",
        };

        setUsersByRole(
          Object.entries(roleCounts).map(([role, count]) => ({
            name: roleLabels[role] || role,
            value: count,
            color: roleColors[role] || "#6b7280",
          }))
        );
      }

      // Fetch resources by status
      const { data: resources } = await supabase
        .from("resources")
        .select("status");

      if (resources) {
        const statusCounts = resources.reduce((acc: any, resource: any) => {
          const status = resource.status || "DRAFT";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const statusColors: any = {
          CONFORMABLE: "#10b981",
          IN_REVIEW: "#f59e0b",
          DRAFT: "#6b7280",
          UNCONFORMABLE: "#ef4444",
        };

        const statusLabels: any = {
          CONFORMABLE: "Conform",
          IN_REVIEW: "În evaluare",
          DRAFT: "Ciornă",
          UNCONFORMABLE: "Neconform",
        };

        setResourcesByStatus(
          Object.entries(statusCounts).map(([status, count]) => ({
            name: statusLabels[status] || status,
            value: count,
            color: statusColors[status] || "#6b7280",
          }))
        );
      }

      // Fetch resources over time (last 6 months)
      const { data: resourcesWithDate } = await supabase
        .from("resources")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (resourcesWithDate) {
        const monthCounts: any = {};
        const months = [
          "Ian",
          "Feb",
          "Mar",
          "Apr",
          "Mai",
          "Iun",
          "Iul",
          "Aug",
          "Sep",
          "Oct",
          "Noi",
          "Dec",
        ];

        resourcesWithDate.forEach((r: any) => {
          const date = new Date(r.created_at);
          const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        });

        const last6Months = Object.entries(monthCounts)
          .slice(-6)
          .map(([month, count]) => ({ month: month.split(" ")[0], count }));

        setResourcesOverTime(last6Months);
      }

      // Fetch users over time (last 6 months)
      const { data: usersWithDate } = await supabase
        .from("users")
        .select("created_at")
        .order("created_at", { ascending: true });

      if (usersWithDate) {
        const monthCounts: any = {};
        const months = [
          "Ian",
          "Feb",
          "Mar",
          "Apr",
          "Mai",
          "Iun",
          "Iul",
          "Aug",
          "Sep",
          "Oct",
          "Noi",
          "Dec",
        ];

        let cumulative = 0;
        usersWithDate.forEach((u: any) => {
          const date = new Date(u.created_at);
          const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
          monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
        });

        const last6Months = Object.entries(monthCounts)
          .slice(-6)
          .map(([month, count]: any) => {
            cumulative += count;
            return { month: month.split(" ")[0], count: cumulative };
          });

        setUsersOverTime(last6Months);
      }

      // Fetch top disciplines
      const { data: resourcesWithDiscipline } = await supabase
        .from("resources")
        .select("discipline_id, disciplines(name)")
        .not("discipline_id", "is", null);

      if (resourcesWithDiscipline) {
        const disciplineCounts: any = {};
        resourcesWithDiscipline.forEach((r: any) => {
          const name = r.disciplines?.name || "Altele";
          disciplineCounts[name] = (disciplineCounts[name] || 0) + 1;
        });

        const top8 = Object.entries(disciplineCounts)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 8)
          .map(([name, count]) => ({ name, count }));

        setTopDisciplines(top8);
      }

      // Fetch top authors
      const { data: resourcesWithAuthor } = await supabase
        .from("resources")
        .select(
          "author_id, users!resources_author_id_fkey(first_name, last_name)"
        )
        .not("author_id", "is", null);

      if (resourcesWithAuthor) {
        const authorCounts: any = {};
        resourcesWithAuthor.forEach((r: any) => {
          const name = r.users
            ? `${r.users.first_name} ${r.users.last_name}`
            : "Anonim";
          authorCounts[name] = (authorCounts[name] || 0) + 1;
        });

        const top5 = Object.entries(authorCounts)
          .sort(([, a]: any, [, b]: any) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        setTopAuthors(top5);
      }

      // Fetch top groups
      const { data: groupsWithMembers } = await supabase
        .from("groups")
        .select("id, name, group_members(count)");

      if (groupsWithMembers) {
        const groupCounts = groupsWithMembers.map((g: any) => ({
          name: g.name,
          count: g.group_members?.length || 0,
        }));

        const top5 = groupCounts
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5);

        setTopGroups(top5);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setLoading(false);
    }
  };

  if (authLoading || !mounted || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin(user, profile)) {
    return null;
  }

  const totalResources = resourcesCount.data || 0;
  const totalUsers = usersCount.data || 0;
  const totalGroups = groupsCount.data || 0;
  const conformResources =
    resourcesByStatus.find((s) => s.name === "Conform")?.value || 0;

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Statistici & Analytics
        </h1>
        <p className="text-gray-600 mt-1">
          Vizualizare date și metrici importante ale platformei
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          title="Total Resurse"
          value={totalResources.toLocaleString()}
          icon={BookOpen}
          color="text-blue-600"
        />
        <MetricCard
          title="Total Utilizatori"
          value={totalUsers.toLocaleString()}
          icon={Users}
          color="text-purple-600"
        />
        <MetricCard
          title="Total Grupe"
          value={totalGroups.toLocaleString()}
          icon={GraduationCap}
          color="text-green-600"
        />
        <MetricCard
          title="Resurse Conforme"
          value={conformResources.toLocaleString()}
          icon={FileCheck}
          color="text-amber-600"
        />
      </div>

      {/* Line Charts - Evoluție în timp */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📈 Evoluție în Timp
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Evoluția resurselor */}
          <Card>
            <CardHeader>
              <CardTitle>Evoluția Resurselor Create</CardTitle>
              <CardDescription>Ultimele 6 luni</CardDescription>
            </CardHeader>
            <CardContent>
              <HighchartsWrapper
                options={{
                  chart: {
                    type: "line",
                    height: 300,
                  },
                  title: {
                    text: "",
                  },
                  xAxis: {
                    categories: resourcesOverTime.map((d) => d.month),
                  },
                  yAxis: {
                    title: {
                      text: "Număr Resurse",
                    },
                  },
                  series: [
                    {
                      type: "line",
                      name: "Resurse",
                      data: resourcesOverTime.map((d) => d.count),
                      color: "#3b82f6",
                    },
                  ] as any,
                  credits: {
                    enabled: false,
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Evoluția utilizatorilor */}
          <Card>
            <CardHeader>
              <CardTitle>Creșterea Utilizatorilor</CardTitle>
              <CardDescription>Ultimele 6 luni</CardDescription>
            </CardHeader>
            <CardContent>
              <HighchartsWrapper
                options={{
                  chart: {
                    type: "line",
                    height: 300,
                  },
                  title: {
                    text: "",
                  },
                  xAxis: {
                    categories: usersOverTime.map((d) => d.month),
                  },
                  yAxis: {
                    title: {
                      text: "Număr Utilizatori",
                    },
                  },
                  series: [
                    {
                      type: "line",
                      name: "Utilizatori",
                      data: usersOverTime.map((d) => d.count),
                      color: "#8b5cf6",
                    },
                  ] as any,
                  credits: {
                    enabled: false,
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bar Charts - Top-uri */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🏆 Top Performanțe
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Top Discipline */}
          <Card>
            <CardHeader>
              <CardTitle>Top 8 Discipline</CardTitle>
              <CardDescription>Cele mai multe resurse</CardDescription>
            </CardHeader>
            <CardContent>
              <HighchartsWrapper
                options={{
                  chart: {
                    type: "bar",
                    height: 350,
                  },
                  title: {
                    text: "",
                  },
                  xAxis: {
                    categories: topDisciplines.map((d) => d.name),
                  },
                  yAxis: {
                    title: {
                      text: "Resurse",
                    },
                  },
                  series: [
                    {
                      type: "bar",
                      name: "Resurse",
                      data: topDisciplines.map((d) => d.count),
                      color: "#3b82f6",
                    },
                  ] as any,
                  legend: {
                    enabled: false,
                  },
                  credits: {
                    enabled: false,
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Top Autori */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Autori</CardTitle>
              <CardDescription>Cei mai productivi</CardDescription>
            </CardHeader>
            <CardContent>
              <HighchartsWrapper
                options={{
                  chart: {
                    type: "bar",
                    height: 350,
                  },
                  title: {
                    text: "",
                  },
                  xAxis: {
                    categories: topAuthors.map((d) => d.name),
                  },
                  yAxis: {
                    title: {
                      text: "Resurse",
                    },
                  },
                  series: [
                    {
                      type: "bar",
                      name: "Resurse",
                      data: topAuthors.map((d) => d.count),
                      color: "#10b981",
                    },
                  ] as any,
                  legend: {
                    enabled: false,
                  },
                  credits: {
                    enabled: false,
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Top Grupe */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Grupe</CardTitle>
              <CardDescription>Număr de cursanți</CardDescription>
            </CardHeader>
            <CardContent>
              <HighchartsWrapper
                options={{
                  chart: {
                    type: "bar",
                    height: 350,
                  },
                  title: {
                    text: "",
                  },
                  xAxis: {
                    categories: topGroups.map((d) => d.name),
                  },
                  yAxis: {
                    title: {
                      text: "Cursanți",
                    },
                  },
                  series: [
                    {
                      type: "bar",
                      name: "Cursanți",
                      data: topGroups.map((d) => d.count),
                      color: "#f59e0b",
                    },
                  ] as any,
                  legend: {
                    enabled: false,
                  },
                  credits: {
                    enabled: false,
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Pie & Radial Charts - Distribuții */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📊 Distribuții
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Polar Radial Bar - Resurse */}
          <Card>
            <CardHeader>
              <CardTitle>📈 Rezumat Detaliat Resurse</CardTitle>
              <CardDescription>
                Status actual resurse ({totalResources} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resourcesByStatus.length > 0 ? (
                <HighchartsWrapper
                  options={{
                    chart: {
                      polar: true,
                      type: "column",
                      height: 400,
                    },
                    title: {
                      text: "",
                    },
                    pane: {
                      size: "70%",
                      startAngle: 0,
                      endAngle: 360,
                    },
                    xAxis: {
                      tickInterval: 1,
                      labels: {
                        style: {
                          fontSize: "13px",
                          fontWeight: "500",
                        },
                      },
                      lineWidth: 0,
                      categories: resourcesByStatus.map((s) => s.name),
                    },
                    yAxis: {
                      min: 0,
                      max:
                        Math.max(...resourcesByStatus.map((s) => s.value)) *
                        1.2,
                      lineWidth: 0,
                      tickInterval: Math.ceil(totalResources / 4),
                      reversedStacks: false,
                      endOnTick: false,
                      showLastLabel: false,
                      labels: {
                        enabled: false,
                      },
                    },
                    plotOptions: {
                      column: {
                        stacking: "normal",
                        borderWidth: 0,
                        pointPadding: 0,
                        groupPadding: 0.15,
                        dataLabels: {
                          enabled: true,
                          format: "{y}",
                          style: {
                            fontSize: "11px",
                            fontWeight: "bold",
                          },
                        },
                      },
                    },
                    series: [
                      {
                        type: "column",
                        name: "Resurse",
                        data: resourcesByStatus.map((s) => ({
                          y: s.value,
                          color: s.color,
                        })),
                        showInLegend: false,
                      },
                    ] as any,
                    tooltip: {
                      formatter: function (this: any) {
                        return `<b>${this.x}</b><br/>${
                          this.series.name
                        }: ${this.y.toLocaleString()}`;
                      },
                    },
                    credits: {
                      enabled: false,
                    },
                  }}
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  Nu există date disponibile
                </div>
              )}
            </CardContent>
          </Card>

          {/* Packed Bubble - Utilizatori */}
          <Card>
            <CardHeader>
              <CardTitle>👥 Detalii Utilizatori</CardTitle>
              <CardDescription>
                Tipuri de utilizatori ({totalUsers} total)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersByRole.length > 0 ? (
                <HighchartsWrapper
                  options={{
                    chart: {
                      type: "packedbubble",
                      height: 400,
                    },
                    title: {
                      text: "",
                    },
                    tooltip: {
                      useHTML: true,
                      pointFormat:
                        "<b>{point.name}:</b> {point.value} utilizatori",
                    },
                    plotOptions: {
                      packedbubble: {
                        minSize: "50%",
                        maxSize: "200%",
                        layoutAlgorithm: {
                          splitSeries: false,
                          gravitationalConstant: 0.01,
                          friction: -0.9,
                        },
                        dataLabels: {
                          enabled: true,
                          format: "{point.name}",
                          style: {
                            color: "white",
                            textOutline: "none",
                            fontWeight: "bold",
                            fontSize: "14px",
                          },
                        },
                      },
                    },
                    series: [
                      {
                        type: "packedbubble",
                        name: "Utilizatori",
                        data: usersByRole.map((role) => ({
                          name: role.name,
                          value: role.value,
                          color: role.color,
                        })),
                      },
                    ] as any,
                    credits: {
                      enabled: false,
                    },
                  }}
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-gray-500">
                  Nu există date disponibile
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
