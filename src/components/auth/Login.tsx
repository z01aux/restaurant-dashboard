// En la sección de cuentas demo, cambia los textos para incluir contraseñas:
<div className="grid grid-cols-2 gap-2">
  <button
    type="button"
    onClick={() => handleDemoLogin('admin', 'admin123')}
    disabled={isLoggingIn}
    className="text-xs bg-red-100 text-red-700 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 border border-red-200"
  >
    Admin (admin123)
  </button>
  <button
    type="button"
    onClick={() => handleDemoLogin('cajero01', 'cajero123')}
    disabled={isLoggingIn}
    className="text-xs bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 border border-blue-200"
  >
    Cajero 01 (cajero123)
  </button>
  <button
    type="button"
    onClick={() => handleDemoLogin('mesero01', 'mesero123')}
    disabled={isLoggingIn}
    className="text-xs bg-green-100 text-green-700 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 border border-green-200"
  >
    Mesero 01 (mesero123)
  </button>
  <button
    type="button"
    onClick={() => handleDemoLogin('cocina01', 'cocina123')}
    disabled={isLoggingIn}
    className="text-xs bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 border border-purple-200"
  >
    Cocina 01 (cocina123)
  </button>
</div>
