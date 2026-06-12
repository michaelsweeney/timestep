// Shared synthetic ESO fixtures for parser/converter tests. Shapes mirror
// real EnergyPlus output: reserved stamp ids 1-6, four frequency tags,
// min/max companion columns on Daily/Monthly, hourly values following
// their own full-hour stamp.

export const MINI_ESO = `Program Version,EnergyPlus, Version 25.2.0-cf7368216c, YMD=2026.06.11 06:00
1,5,Environment Title[],Latitude[deg],Longitude[deg],Time Zone[],Elevation[m]
2,8,Day of Simulation[],Month[],Day of Month[],DST Indicator[1=yes 0=no],Hour[],StartMinute[],EndMinute[],DayType
3,5,Cumulative Day of Simulation[],Month[],Day of Month[],DST Indicator[1=yes 0=no],DayType  ! When Daily Report Variables Requested
4,2,Cumulative Days of Simulation[],Month[]  ! When Monthly Report Variables Requested
5,1,Cumulative Days of Simulation[] ! When Run Period Report Variables Requested
6,1,Calendar Year of Simulation[] ! When Annual Report Variables Requested
7,1,Environment,Site Outdoor Air Drybulb Temperature [C] !Hourly
8,1,Environment,Site Total Sky Cover [] !Hourly
12,1,ZONE ONE,Zone Mean Air Temperature [C] !TimeStep
63,7,ZN001:WALL001,Surface Inside Face Temperature [C] !Daily [Value,Min,Hour,Minute,Max,Hour,Minute]
50,9,TEST 352A,Other Equipment Total Heating Energy [J] !Monthly [Value,Min,Day,Hour,Minute,Max,Day,Hour,Minute]
End of Data Dictionary
`;

export const MINI_ESO_DATA = `${MINI_ESO}1,DENVER CENTENNIAL  GOLDEN   N ANN HTG 99% CONDNS DB,  39.74,-105.18,  -7.00,1829.00
2,1,12,21, 0, 1, 0.00,10.00,WinterDesignDay
12,20.5
2,1,12,21, 0, 1,10.00,20.00,WinterDesignDay
12,21.5
2,1,12,21, 0, 1, 0.00,60.00,WinterDesignDay
7,-15.5
8,0.0
3,1,12,21, 0,WinterDesignDay
63,18.0,15.0,1,10,22.0,14,60
4,1,12
50,-30412800.0,-316800.0,21, 1,15,-316800.0,21, 1,15
End of Data
`;

// A fixture with both a report variable (id 7) and meters (ids 65, 1992) — the
// keyless "<Name> [units] !freq" dictionary form. A monthly meter carries the
// Daily/Monthly min/max companion columns. Exercises meter recovery without
// needing a real EnergyPlus run.
export const MINI_ESO_METER = `Program Version,EnergyPlus, Version 25.2.0-cf7368216c, YMD=2026.06.11 06:00
2,8,Day of Simulation[],Month[],Day of Month[],DST Indicator[1=yes 0=no],Hour[],StartMinute[],EndMinute[],DayType
4,2,Cumulative Days of Simulation[],Month[]  ! When Monthly Report Variables Requested
7,1,Environment,Site Outdoor Air Drybulb Temperature [C] !Hourly
65,1,Electricity:Facility [J] !Hourly
1992,9,NaturalGas:Facility [J] !Monthly [Value,Min,Day,Hour,Minute,Max,Day,Hour,Minute]
End of Data Dictionary
`;

export const MINI_ESO_METER_DATA = `${MINI_ESO_METER}1,DENVER CENTENNIAL  GOLDEN   N ANN HTG 99% CONDNS DB,  39.74,-105.18,  -7.00,1829.00
2,1,12,21, 0, 1, 0.00,60.00,WinterDesignDay
7,-15.5
65,123456.0
4,1,12
1992,7890123.0,0.0,21, 1,15,500000.0,21, 1,15
End of Data
`;
