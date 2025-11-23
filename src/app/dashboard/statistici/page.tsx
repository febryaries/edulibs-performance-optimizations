"use client";

import { useEffect, useState } from "react";
import { useAuth, isAdmin } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
  Clock,
} from "lucide-react";

// Mock data - va fi înlocuit cu date reale din Supabase
const resourcesOverTimeData = [
  { month: "Ian", resurse: 45 },
  { month: "Feb", resurse: 52 },
  { month: "Mar", resurse: 68 },
  { month: "Apr", resurse: 73 },
  { month: "Mai", resurse: 89 },
  { month: "Iun", resurse: 95 },
];

const resourcesByStatusData = [
  { name: "Conform", value: 245, color: "#10b981" },
  { name: "În evaluare", value: 89, color: "#f59e0b" },
  { name: "Ciornă", value: 156, color: "#6b7280" },
  { name: "Neconform", value: 34, color: "#ef4444" },
];

const topDisciplinesData = [
  { name: "Matematică", resurse: 145 },
  { name: "Limba Română", resurse: 132 },
  { name: "Științe", resurse: 98 },
  { name: "Istorie", resurse: 87 },
  { name: "Geografie", resurse: 76 },
  { name: "Fizică", resurse: 65 },
  { name: "Chimie", resurse: 54 },
  { name: "Biologie", resurse: 48 },
];

const topAuthorsData = [
  { name: "Ion Popescu", resurse: 45 },
  { name: "Maria Ionescu", resurse: 38 },
  { name: "Andrei Georgescu", resurse: 32 },
  { name: "Elena Dumitrescu", resurse: 28 },
  { name: "Mihai Stanciu", resurse: 25 },
];

const usersOverTimeData = [
  { month: "Ian", utilizatori: 1200 },
  { month: "Feb", utilizatori: 1450 },
  { month: "Mar", utilizatori: 1680 },
  { month: "Apr", utilizatori: 1920 },
  { month: "Mai", utilizatori: 2150 },
  { month: "Iun", utilizatori: 2380 },
];

const usersByRoleData = [
  { name: "Student", value: 15234, color: "#3b82f6" },
  { name: "Formator", value: 1245, color: "#8b5cf6" },
  { name: "Evaluator", value: 234, color: "#f59e0b" },
  { name: "Admin", value: 45, color: "#ef4444" },
];

const topGroupsData = [
  { name: "Grupa 101", cursanti: 32 },
  { name: "Grupa 205", cursanti: 30 },
  { name: "Grupa 312", cursanti: 28 },
  { name: "Grupa 145", cursanti: 27 },
  { name: "Grupa 220", cursanti: 25 },
];

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  change?: string;
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
      {change && (
        <p className="text-xs text-green-600 mt-1">
          <TrendingUp className="inline h-3 w-3 mr-1" />
          {change}
        </p>
      )}
    </CardContent>
  </Card>
);

export default function StatisticiPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && mounted) {
      if (!user || !isAdmin(user)) {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, mounted, router]);

  if (authLoading || !mounted) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isAdmin(user)) {
    return null;
  }

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
          value="6,973"
          change="+12% față de luna trecută"
          icon={BookOpen}
          color="text-blue-600"
        />
        <MetricCard
          title="Total Utilizatori"
          value="17,339"
          change="+8% față de luna trecută"
          icon={Users}
          color="text-purple-600"
        />
        <MetricCard
          title="Total Grupe"
          value="499"
          change="+5% față de luna trecută"
          icon={GraduationCap}
          color="text-green-600"
        />
        <MetricCard
          title="Rata Aprobare"
          value="87.8%"
          change="+2.3% față de luna trecută"
          icon={FileCheck}
          color="text-amber-600"
        />
      </div>

      {/* Resurse Educaționale Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          📊 Resurse Educaționale
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Evoluția resurselor */}
          <Card>
            <CardHeader>
              <CardTitle>Evoluția Resurselor Create</CardTitle>
              <CardDescription>Ultimele 6 luni</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={resourcesOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="resurse"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Resurse"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuția pe statusuri */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuție pe Statusuri</CardTitle>
              <CardDescription>Status actual resurse</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={resourcesByStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {resourcesByStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) =>
                      `${value} (${entry.payload.value.toLocaleString()})`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top discipline */}
          <Card>
            <CardHeader>
              <CardTitle>Top 8 Discipline</CardTitle>
              <CardDescription>Cele mai multe resurse</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topDisciplinesData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Bar dataKey="resurse" fill="#3b82f6" name="Resurse" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top autori */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Autori</CardTitle>
              <CardDescription>Cei mai productivi</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topAuthorsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="resurse" fill="#10b981" name="Resurse" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Utilizatori Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          👥 Utilizatori
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Evoluția utilizatorilor */}
          <Card>
            <CardHeader>
              <CardTitle>Creșterea Utilizatorilor</CardTitle>
              <CardDescription>Ultimele 6 luni</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={usersOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="utilizatori"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Utilizatori"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuția pe roluri */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuție pe Roluri</CardTitle>
              <CardDescription>Tipuri de utilizatori</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usersByRoleData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {usersByRoleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => value.toLocaleString()}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry: any) =>
                      `${value} (${entry.payload.value.toLocaleString()})`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Grupe & Cursanți Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          🎓 Grupe & Cursanți
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Top grupe */}
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Grupe</CardTitle>
              <CardDescription>Număr de cursanți</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topGroupsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="cursanti" fill="#f59e0b" name="Cursanți" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Metrici grupe */}
          <Card>
            <CardHeader>
              <CardTitle>Metrici Grupe</CardTitle>
              <CardDescription>Statistici generale</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Grupe</p>
                  <p className="text-2xl font-bold text-blue-600">499</p>
                </div>
                <GraduationCap className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Total Cursanți</p>
                  <p className="text-2xl font-bold text-green-600">6,969</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Medie Cursanți/Grupă</p>
                  <p className="text-2xl font-bold text-purple-600">14</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
