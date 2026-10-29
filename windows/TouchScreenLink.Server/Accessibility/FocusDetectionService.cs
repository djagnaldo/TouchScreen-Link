using System;
using System.Diagnostics;
using System.Windows.Automation;

namespace TouchScreenLink.Server.Accessibility;

/// <summary>
/// Monitora o elemento atualmente focado no Windows utilizando a API nativa
/// Windows UI Automation. Notifica o dispositivo Android quando o usuário seleciona
/// campos de texto (Search, Edit, Document, ComboBox) para ativar o mini teclado.
/// </summary>
public sealed class FocusDetectionService
{
    private readonly Action<bool, string, string, bool, double, double, double, double> _onFocusChanged;
    private AutomationFocusChangedEventHandler? _focusHandler;
    private bool _isRunning;

    public FocusDetectionService(Action<bool, string, string, bool, double, double, double, double> onFocusChanged)
    {
        _onFocusChanged = onFocusChanged;
    }

    public void Start()
    {
        if (_isRunning) return;

        try
        {
            _focusHandler = OnAutomationFocusChanged;
            Automation.AddAutomationFocusChangedEventHandler(_focusHandler);
            _isRunning = true;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"Aviso: Falha ao registrar UI Automation: {ex.Message}");
        }
    }

    private void OnAutomationFocusChanged(object sender, AutomationFocusChangedEventArgs e)
    {
        try
        {
            if (sender is AutomationElement element)
            {
                var controlType = element.Current.ControlType;
                string fieldName = element.Current.Name ?? "";

                bool isTextInput = (controlType == ControlType.Edit ||
                                   controlType == ControlType.Document ||
                                   controlType == ControlType.ComboBox) &&
                                   element.Current.IsKeyboardFocusable;

                string typeName = controlType.ProgrammaticName.Replace("ControlType.", "").ToLower();

                bool isMultiLine = false;
                if (controlType == ControlType.Document) isMultiLine = true;
                else if (element.TryGetCurrentPattern(ScrollPattern.Pattern, out _)) isMultiLine = true;

                var rect = element.Current.BoundingRectangle;

                _onFocusChanged(isTextInput, typeName, fieldName, isMultiLine, rect.X, rect.Y, rect.Width, rect.Height);
            }
        }
        catch {}
    }

    public void Stop()
    {
        if (!_isRunning) return;
        _isRunning = false;

        try
        {
            if (_focusHandler != null)
            {
                Automation.RemoveAutomationFocusChangedEventHandler(_focusHandler);
                _focusHandler = null;
            }
        }
        catch {}
    }
}
