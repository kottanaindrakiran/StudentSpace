import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Loader2, Users, SlidersHorizontal, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import UserCard from '@/components/people/UserCard';
import { useUsers, UserFilter } from '@/hooks/useUsers';
import { useColleges } from '@/hooks/useColleges';
import { branches, generateYears } from '@/data/constants';

const FindPeople = () => {
    const [searchParams] = useSearchParams();
    const initialTab = (searchParams.get('tab') as 'all' | 'student' | 'alumni') || 'all';

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'student' | 'alumni'>(initialTab);

    // Filters
    const [filters, setFilters] = useState({
        college: 'All',
        branch: 'All',
        batch: 'All',
    });

    const { data: users, isLoading, error } = useUsers({
        search: searchQuery,
        role: activeTab === 'all' ? undefined : activeTab,
        college: filters.college,
        branch: filters.branch,
        batch: filters.batch
    });

    const { data: colleges } = useColleges();
    const passingYears = generateYears();

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const clearFilters = () => {
        setFilters({ college: 'All', branch: 'All', batch: 'All' });
        setSearchQuery('');
        setActiveTab('all');
    };

    const hasActiveFilters = filters.college !== 'All' || filters.branch !== 'All' || filters.batch !== 'All' || searchQuery;

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border">
                <div className="container max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold">Find People</h1>
                            <p className="text-sm text-muted-foreground">Connect with students & alumni</p>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="shrink-0 relative">
                                    <SlidersHorizontal className="w-4 h-4" />
                                    {(filters.college !== 'All' || filters.branch !== 'All' || filters.batch !== 'All') && (
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Filter People</SheetTitle>
                                    <SheetDescription>
                                        Narrow down your search results.
                                    </SheetDescription>
                                </SheetHeader>

                                <div className="space-y-6 py-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">College</label>
                                        <Select value={filters.college} onValueChange={(v) => handleFilterChange('college', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Colleges" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Colleges</SelectItem>
                                                {colleges?.map((college) => (
                                                    <SelectItem key={college.id} value={college.college_name || ''}>
                                                        {college.college_name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Branch</label>
                                        <Select value={filters.branch} onValueChange={(v) => handleFilterChange('branch', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Branches" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Branches</SelectItem>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch} value={branch}>{branch}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Passing Year</label>
                                        <Select value={filters.batch} onValueChange={(v) => handleFilterChange('batch', v)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="All Years" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="All">All Years</SelectItem>
                                                {passingYears.map((year) => (
                                                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button onClick={() => setFilters({ college: 'All', branch: 'All', batch: 'All' })} variant="outline" className="w-full">
                                        <FilterX className="w-4 h-4 mr-2" />
                                        Reset Filters
                                    </Button>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Type Tabs */}
                    <div className="mt-4">
                        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                            <TabsList className="w-full grid grid-cols-3">
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="student">Students</TabsTrigger>
                                <TabsTrigger value="alumni">Alumni</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </header>

            {/* User List */}
            <div className="container max-w-2xl mx-auto px-4 py-6">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : error ? (
                    <div className="text-center py-12 text-destructive">
                        <p>Failed to load users. Please try again.</p>
                    </div>
                ) : users && users.length > 0 ? (
                    <div className="grid gap-3">
                        {users.map((user, index) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <UserCard user={user} />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-3">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <Users className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">No one found</h3>
                            <p className="text-muted-foreground text-sm">
                                Try adjusting your search or filters to find more people.
                            </p>
                        </div>
                        {hasActiveFilters && (
                            <Button variant="link" onClick={clearFilters} className="text-primary">
                                Clear all filters
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FindPeople;
