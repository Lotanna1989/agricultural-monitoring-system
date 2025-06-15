// src/components/PrivateDashboardWrapper.js
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase/firebase';

const withUserId = (Component) => {
  return (props) => {
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) setUserId(user.uid);
        else setUserId(null);
        setLoading(false);
      });
      return () => unsubscribe();
    }, []);

    if (loading) return <div>Loading...</div>;

    if (!userId) return <div>Please log in.</div>;

    return <Component {...props} userId={userId} />;
  };
};

export default withUserId;
