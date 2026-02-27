const axios = require('axios');

async function verify() {
    const baseUrl = 'http://localhost:3001';
    console.log('--- Verifying University Application APIs ---');

    try {
        // 1. Fetch Countries
        const countries = await axios.get(`${baseUrl}/api/master/countries`);
        console.log('✅ Master Countries:', countries.data.length);
        const countryId = countries.data[0]?.id;

        if (countryId) {
            // 2. Fetch Universities
            const universities = await axios.get(`${baseUrl}/api/master/universities?countryId=${countryId}`);
            console.log('✅ Master Universities:', universities.data.length);
            const universityId = universities.data[0]?.id;

            if (universityId) {
                // 3. Fetch Courses
                const courses = await axios.get(`${baseUrl}/api/master/courses?universityId=${universityId}`);
                console.log('✅ Master Courses:', courses.data.length);
            }
        }

        // 4. Fetch Associates
        const associates = await axios.get(`${baseUrl}/api/master/associates`);
        console.log('✅ Master Associates:', associates.data.length);

        // 5. Fetch Applications
        const applications = await axios.get(`${baseUrl}/api/applications`);
        console.log('✅ Applications List:', applications.data.applications?.length || 0);

    } catch (error) {
        console.error('❌ Verification failed:', error.response?.data || error.message);
    }
}

verify();
