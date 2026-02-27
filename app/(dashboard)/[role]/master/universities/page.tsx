"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Globe, ChevronRight, Loader2, ListTree } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CountryWithCount {
    id: string;
    name: string;
    code: string | null;
    universityCount: number;
}

export default function UniversitiesCountryListPage() {
    const router = useRouter();
    const params = useParams();
    const role = params.role as string;

    const [countries, setCountries] = useState<CountryWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        const fetchCountries = async () => {
            try {
                const response = await axios.get("/api/master/countries-with-university-count");
                setCountries(response.data);
            } catch (error) {
                console.error("Failed to fetch countries:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCountries();
    }, []);

    const filteredCountries = useMemo(() => {
        return countries.filter(c =>
            c.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [countries, search]);

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Masters &gt; Universities</h1>
                <p className="text-muted-foreground">Select a country to manage its universities.</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search country..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>Country Name</TableHead>
                            <TableHead>Country Code</TableHead>
                            <TableHead>Universities</TableHead>
                            <TableHead className="w-[150px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCountries.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-48 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <Globe className="h-8 w-8 opacity-20" />
                                        <span>No countries found.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCountries.map((country, idx) => (
                                <TableRow
                                    key={country.id}
                                    className="hover:bg-muted/30 transition-colors cursor-pointer group"
                                    onClick={() => router.push(`/${role}/master/universities/${country.id}`)}
                                >
                                    <TableCell className="font-medium text-muted-foreground">
                                        {idx + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                                <Globe className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold text-base">{country.name}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {country.code ? (
                                            <Badge variant="outline" className="font-mono bg-muted/50">
                                                {country.code}
                                            </Badge>
                                        ) : (
                                            <span className="text-muted-foreground italic text-xs">N/A</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-medium">
                                            {country.universityCount} Universities
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="group-hover:text-primary">
                                            Manage
                                            <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
