
import React from "react";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    PieChart as PieChartIcon,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Briefcase
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

const Portfolio = () => {
    // Mock Data
    const portfolioStats = [
        {
            title: "Total Balance",
            value: "$124,592.00",
            change: "+2.5%",
            trend: "up",
            icon: Wallet,
            color: "text-blue-500",
        },
        {
            title: "Total Profit/Loss",
            value: "$14,230.50",
            change: "+12.4%",
            trend: "up",
            icon: TrendingUp,
            color: "text-green-500",
        },
        {
            title: "Daily Change",
            value: "-$420.20",
            change: "-0.34%",
            trend: "down",
            icon: Activity,
            color: "text-red-500",
        },
        {
            title: "Cash Available",
            value: "$45,000.00",
            change: "0%",
            trend: "neutral",
            icon: DollarSign,
            color: "text-yellow-500",
        },
    ];

    const holdings = [
        { symbol: "AAPL", name: "Apple Inc.", qty: 150, avgPrice: 145.20, currentPrice: 178.35, value: 26752.50, change: 22.8 },
        { symbol: "MSFT", name: "Microsoft Corp.", qty: 80, avgPrice: 280.50, currentPrice: 332.40, value: 26592.00, change: 18.5 },
        { symbol: "TSLA", name: "Tesla Inc.", qty: 40, avgPrice: 210.00, currentPrice: 195.50, value: 7820.00, change: -6.9 },
        { symbol: "AMZN", name: "Amazon.com Inc.", qty: 100, avgPrice: 110.25, currentPrice: 135.20, value: 13520.00, change: 22.6 },
        { symbol: "NVDA", name: "NVIDIA Corp.", qty: 25, avgPrice: 350.00, currentPrice: 460.10, value: 11502.50, change: 31.4 },
        { symbol: "GOOGL", name: "Alphabet Inc.", qty: 60, avgPrice: 105.50, currentPrice: 132.40, value: 7944.00, change: 25.4 },
    ];

    const allocation = [
        { name: "Technology", value: 65, color: "bg-blue-500" },
        { name: "Consumer Cyclical", value: 20, color: "bg-purple-500" },
        { name: "Communication", value: 10, color: "bg-green-500" },
        { name: "Cash", value: 5, color: "bg-slate-500" },
    ];

    return (
        <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Briefcase className="h-8 w-8 text-primary" />
                        Portfolio Overview
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Track your performance, analyze holdings, and manage your assets.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Import Data</Button>
                    <Button>Add Transaction</Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {portfolioStats.map((stat, index) => (
                    <Card key={index} className="overflow-hidden border-l-4" style={{ borderLeftColor: stat.trend === 'up' ? '#22c55e' : stat.trend === 'down' ? '#ef4444' : '#eab308' }}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className={`text-xs flex items-center mt-1 ${stat.trend === "up" ? "text-green-500" :
                                    stat.trend === "down" ? "text-red-500" :
                                        "text-muted-foreground"
                                }`}>
                                {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3 mr-1" /> :
                                    stat.trend === "down" ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
                                {stat.change}
                                <span className="text-muted-foreground ml-1">from yesterday</span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-8 md:grid-cols-7">
                {/* Holdings Table */}
                <Card className="col-span-1 md:col-span-5 hover:shadow-md transition-shadow">
                    <CardHeader>
                        <CardTitle>Current Holdings</CardTitle>
                        <CardDescription>
                            Detailed view of your current active positions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Symbol</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="text-right">Qty</TableHead>
                                    <TableHead className="text-right">Avg Price</TableHead>
                                    <TableHead className="text-right">Current</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                    <TableHead className="text-right">Return</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {holdings.map((stock) => (
                                    <TableRow key={stock.symbol} className="group cursor-pointer hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                    {stock.symbol[0]}
                                                </div>
                                                {stock.symbol}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{stock.name}</TableCell>
                                        <TableCell className="text-right">{stock.qty}</TableCell>
                                        <TableCell className="text-right">${stock.avgPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right">${stock.currentPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-semibold">${stock.value.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant={stock.change >= 0 ? "default" : "destructive"} className={stock.change >= 0 ? "bg-green-500 hover:bg-green-600" : ""}>
                                                {stock.change >= 0 ? "+" : ""}{stock.change}%
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Allocation */}
                <Card className="col-span-1 md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5" />
                            Allocation
                        </CardTitle>
                        <CardDescription>
                            Assets distribution by sector.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {allocation.map((item) => (
                                <div key={item.name} className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{item.name}</span>
                                        <span className="text-muted-foreground">{item.value}%</span>
                                    </div>
                                    <Progress value={item.value} className={`h-2`} indicatorClassName={item.color} />
                                </div>
                            ))}

                            <div className="mt-8 p-4 bg-muted/30 rounded-lg border border-dashed">
                                <h4 className="text-sm font-semibold mb-2">Analysis</h4>
                                <p className="text-xs text-muted-foreground">
                                    Your portfolio is heavily weighted towards Technology (65%). Consider diversifying into other sectors to reduce volatility risk.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Portfolio;
