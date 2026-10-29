using System;
using System.Drawing;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;
using TouchScreenLink.Server.Accessibility;
using TouchScreenLink.Server.Bluetooth;
using TouchScreenLink.Server.Capture;
using TouchScreenLink.Server.Encoder;
using TouchScreenLink.Server.Input;
using TouchScreenLink.Server.Network;
using TouchScreenLink.Server.Security;
using TouchScreenLink.Server.UI;

namespace TouchScreenLink.Server;

static class Program
{
    private static Mutex? _singleInstanceMutex;
    private static NotifyIcon? _trayIcon;
    private static StreamServer? _streamServer;
    private static BluetoothServer? _bluetoothServer;
    private static FocusDetectionService? _focusDetector;
    private static DiscoveryBeacon? _discoveryBeacon;
    private static WindowsInputSimulator? _mouseSimulator;
    private static WindowsKeyboardSimulator? _keyboardSimulator;
    private static PairingManager? _pairingManager;
    private static MainWindow? _mainWindow;

    [STAThread]
    static void Main(string[] args)
    {
        _singleInstanceMutex = new Mutex(true, "TouchScreenLink_SingleInstance_Mutex", out bool isNewInstance);
        if (!isNewInstance)
        {
            MessageBox.Show("O TouchScreen Link já está em execução na bandeja do sistema.",
                            "TouchScreen Link", MessageBoxButtons.OK, MessageBoxIcon.Information);
            return;
        }

        ApplicationConfiguration.Initialize();

        try
        {
            InitializeCoreServices();
            CreateTrayIcon();

            bool startSilent = args.Length > 0 && args[0].Equals("--silent", StringComparison.OrdinalIgnoreCase);
            _mainWindow = new MainWindow(_streamServer!, _pairingManager!, _bluetoothServer!);

            if (startSilent)
            {
                Application.Run();
            }
            else
            {
                Application.Run(_mainWindow);
            }
        }
        finally
        {
            Cleanup();
            _singleInstanceMutex.ReleaseMutex();
        }
    }

    private static void InitializeCoreServices()
    {
        _pairingManager = new PairingManager();
        _mouseSimulator = new WindowsInputSimulator();
        _keyboardSimulator = new WindowsKeyboardSimulator();

        // 1. Servidor Principal de Streaming e Toque (Wi-Fi / USB RNDIS)
        _streamServer = new StreamServer(
            port: 45820,
            pairingManager: _pairingManager,
            mouseSimulator: _mouseSimulator,
            keyboardSimulator: _keyboardSimulator,
            onClientConnected: clientIp =>
            {
                _trayIcon?.ShowBalloonTip(3000, "TouchScreen Link",
                    $"Dispositivo conectado ({clientIp}). Espelhamento e toque ativos.", ToolTipIcon.Info);
            },
            onClientDisconnected: () =>
            {
                _trayIcon?.ShowBalloonTip(2000, "TouchScreen Link",
                    "Dispositivo desconectado.", ToolTipIcon.Warning);
            }
        );
        _streamServer.Start();

        // 2. Servidor Bluetooth RFCOMM Complementar (Opcional para teclado e controle)
        _bluetoothServer = new BluetoothServer(_mouseSimulator, _keyboardSimulator);
        _bluetoothServer.Start();

        // 3. Serviço Inteligente de Detecção de Foco em Campos de Texto (UI Automation)
        _focusDetector = new FocusDetectionService(onFocusChanged: (isFocused, fieldType, fieldName, isMultiLine, x, y, w, h) =>
        {
            _streamServer?.NotifyFocusChanged(isFocused, fieldType, fieldName, isMultiLine, x, y, w, h);
        });
        _focusDetector.Start();

        // 4. Beacon UDP para descoberta instantânea
        _discoveryBeacon = new DiscoveryBeacon(serverPort: 45820);
        _discoveryBeacon.Start();
    }

    private static void CreateTrayIcon()
    {
        var contextMenu = new ContextMenuStrip();
        var openItem = new ToolStripMenuItem("Abrir Painel de Administração", null, (s, e) => ShowAdminWindow())
        {
            Font = new Font("Segoe UI", 9, FontStyle.Bold)
        };
        var statusItem = new ToolStripMenuItem("Servidor: Ativo (Porta 45820)") { Enabled = false };
        var btStatus = _bluetoothServer?.IsBluetoothAvailable == true ? "Bluetooth: Pronto (RFCOMM SPP)" : "Bluetooth: Indisponível";
        var btItem = new ToolStripMenuItem(btStatus) { Enabled = false };
        var gpuItem = new ToolStripMenuItem($"Codificador: {MediaFoundationHardwareEncoder.DetectHardwareEncoder()}") { Enabled = false };

        var smartFocusItem = new ToolStripMenuItem("Ativação Inteligente de Teclado (UI Automation)")
        {
            Checked = true
        };
        smartFocusItem.Click += (s, e) =>
        {
            smartFocusItem.Checked = !smartFocusItem.Checked;
            if (smartFocusItem.Checked) _focusDetector?.Start();
            else _focusDetector?.Stop();
        };

        var viewQrItem = new ToolStripMenuItem("Exibir QR Code de Pareamento...", null, (s, e) => ShowPairingWindow());

        var startWithWindowsItem = new ToolStripMenuItem("Iniciar com o Windows")
        {
            Checked = IsRunOnStartupEnabled()
        };
        startWithWindowsItem.Click += (s, e) =>
        {
            startWithWindowsItem.Checked = !startWithWindowsItem.Checked;
            SetRunOnStartup(startWithWindowsItem.Checked);
        };

        var exitItem = new ToolStripMenuItem("Sair do TouchScreen Link", null, (s, e) => Application.Exit());

        contextMenu.Items.Add(openItem);
        contextMenu.Items.Add(new ToolStripSeparator());
        contextMenu.Items.Add(statusItem);
        contextMenu.Items.Add(btItem);
        contextMenu.Items.Add(gpuItem);
        contextMenu.Items.Add(new ToolStripSeparator());
        contextMenu.Items.Add(smartFocusItem);
        contextMenu.Items.Add(viewQrItem);
        contextMenu.Items.Add(startWithWindowsItem);
        contextMenu.Items.Add(new ToolStripSeparator());
        contextMenu.Items.Add(exitItem);

        _trayIcon = new NotifyIcon
        {
            Icon = SystemIcons.Application,
            ContextMenuStrip = contextMenu,
            Text = "TouchScreen Link — Servidor de Tela, Toque e Teclado",
            Visible = true
        };
        _trayIcon.DoubleClick += (s, e) => ShowAdminWindow();
    }

    public static void ShowAdminWindow()
    {
        if (_mainWindow == null || _mainWindow.IsDisposed)
        {
            _mainWindow = new MainWindow(_streamServer!, _pairingManager!, _bluetoothServer!);
        }
        _mainWindow.Show();
        _mainWindow.WindowState = FormWindowState.Normal;
        _mainWindow.BringToFront();
    }

    private static void ShowPairingWindow()
    {
        var form = new Form
        {
            Text = "TouchScreen Link — Pareamento Seguro",
            Size = new Size(380, 480),
            FormBorderStyle = FormBorderStyle.FixedDialog,
            MaximizeBox = false,
            StartPosition = FormStartPosition.CenterScreen
        };

        var lblPin = new Label
        {
            Text = $"Código PIN Temporário:\n{_pairingManager?.CurrentPairingPin}",
            Dock = DockStyle.Top,
            Height = 70,
            TextAlign = ContentAlignment.MiddleCenter,
            Font = new Font("Segoe UI", 16, FontStyle.Bold),
            ForeColor = Color.DarkSlateBlue
        };

        var picQr = new PictureBox
        {
            Dock = DockStyle.Fill,
            SizeMode = PictureBoxSizeMode.CenterImage,
            Image = _pairingManager?.GeneratePairingQrBitmap(300)
        };

        form.Controls.Add(picQr);
        form.Controls.Add(lblPin);
        form.ShowDialog();
    }

    private static bool IsRunOnStartupEnabled()
    {
        using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", false);
        return key?.GetValue("TouchScreenLink") != null;
    }

    private static void SetRunOnStartup(bool enable)
    {
        using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true);
        if (enable) key?.SetValue("TouchScreenLink", $"\"{Application.ExecutablePath}\" --silent");
        else key?.DeleteValue("TouchScreenLink", false);
    }

    private static void Cleanup()
    {
        _trayIcon?.Dispose();
        _focusDetector?.Stop();
        _bluetoothServer?.Stop();
        _discoveryBeacon?.Stop();
        _streamServer?.Stop();
    }
}
