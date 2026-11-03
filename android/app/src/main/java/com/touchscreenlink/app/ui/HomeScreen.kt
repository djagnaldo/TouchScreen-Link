package com.touchscreenlink.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.touchscreenlink.app.model.DiscoveredHost
import com.touchscreenlink.app.model.StreamConfig
import com.touchscreenlink.app.network.DiscoveryClient

@Composable
fun HomeScreen(
    config: StreamConfig,
    onConfigChange: (StreamConfig) -> Unit,
    keepScreenOn: Boolean,
    onKeepScreenOnChange: (Boolean) -> Unit,
    onConnect: (DiscoveredHost) -> Unit
) {
    var discoveredHosts by remember { mutableStateOf<List<DiscoveredHost>>(emptyList()) }
    var isManualDialogVisible by remember { mutableStateOf(false) }
    var selectedHostForPin by remember { mutableStateOf<DiscoveredHost?>(null) }
    var manualIp by remember { mutableStateOf("192.168.1.100") }
    var pairingPin by remember { mutableStateOf("") }

    val discoveryClient = remember {
        DiscoveryClient { newHost ->
            if (discoveredHosts.none { it.id == newHost.id }) {
                discoveredHosts = discoveredHosts + newHost
            }
        }
    }

    LaunchedEffect(Unit) {
        discoveryClient.startListening()
        discoveryClient.sendDiscoveryProbe()
    }

    DisposableEffect(Unit) {
        onDispose {
            discoveryClient.stop()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp)
    ) {
        // Cabeçalho
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "TouchScreen Link",
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Text(
                    text = "Espelhamento de baixa latência e controle de toque para Windows (Wi-Fi / USB)",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8)
                )
            }

            IconButton(
                onClick = { discoveryClient.sendDiscoveryProbe() },
                modifier = Modifier.background(Color(0xFF1E293B), CircleShape)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Atualizar", tint = Color(0xFF38BDF8))
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Lista de Dispositivos Detectados
        Text(
            text = "Computadores Windows Detectados na Rede Local:",
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = Color(0xFFCBD5E1)
        )

        Spacer(modifier = Modifier.height(10.dp))

        if (discoveredHosts.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .background(Color(0xFF1E293B), RoundedCornerShape(12.dp))
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    CircularProgressIndicator(color = Color(0xFF0284C7), modifier = Modifier.size(32.dp))
                    Text(
                        text = "Procurando computadores na rede local (Porta 45824)...",
                        fontSize = 13.sp,
                        color = Color(0xFF94A3B8)
                    )
                    Button(
                        onClick = { isManualDialogVisible = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155))
                    ) {
                        Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Conectar por IP Manual")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(discoveredHosts) { host ->
                    HostCard(host = host, onSelect = {
                        selectedHostForPin = host
                        pairingPin = ""
                    })
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Barra inferior de controle
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = keepScreenOn,
                    onCheckedChange = onKeepScreenOnChange,
                    colors = CheckboxDefaults.colors(checkedColor = Color(0xFF0284C7))
                )
                Text("Manter tela sempre acesa", color = Color(0xFFE2E8F0), fontSize = 12.sp)
            }

            TextButton(onClick = { isManualDialogVisible = true }) {
                Icon(Icons.Default.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Inserir IP Manual", color = Color(0xFF38BDF8), fontSize = 12.sp)
            }
        }
    }

    // Modal de confirmação de PIN para Host Selecionado
    selectedHostForPin?.let { host ->
        AlertDialog(
            onDismissRequest = { selectedHostForPin = null },
            title = { Text("Autenticação com ${host.name}") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "Digite o PIN de 6 dígitos exibido na tela do computador Windows:",
                        fontSize = 13.sp,
                        color = Color(0xFFCBD5E1)
                    )
                    OutlinedTextField(
                        value = pairingPin,
                        onValueChange = { if (it.length <= 6) pairingPin = it.filter { char -> char.isDigit() } },
                        label = { Text("PIN de 6 dígitos") },
                        placeholder = { Text("Ex: 123456") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val hostWithPin = host.copy(pin = pairingPin.trim())
                        selectedHostForPin = null
                        onConnect(hostWithPin)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
                ) {
                    Text("Conectar")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedHostForPin = null }) {
                    Text("Cancelar")
                }
            }
        )
    }

    // Modal de Conexão Manual por IP
    if (isManualDialogVisible) {
        AlertDialog(
            onDismissRequest = { isManualDialogVisible = false },
            title = { Text("Conexão Manual por IP") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = manualIp,
                        onValueChange = { manualIp = it },
                        label = { Text("Endereço IP do Computador") },
                        placeholder = { Text("Ex: 192.168.1.50 ou 192.168.42.129") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    OutlinedTextField(
                        value = pairingPin,
                        onValueChange = { if (it.length <= 6) pairingPin = it.filter { char -> char.isDigit() } },
                        label = { Text("PIN de 6 dígitos do PC") },
                        placeholder = { Text("Ex: 123456") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        isManualDialogVisible = false
                        val host = DiscoveredHost(
                            id = manualIp.trim(),
                            name = "PC Manual (${manualIp.trim()})",
                            ip = manualIp.trim(),
                            port = 45820,
                            pin = pairingPin.trim()
                        )
                        onConnect(host)
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
                ) {
                    Text("Conectar")
                }
            },
            dismissButton = {
                TextButton(onClick = { isManualDialogVisible = false }) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
fun HostCard(host: DiscoveredHost, onSelect: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onSelect() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF334155))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(
                    modifier = Modifier
                        .size(40.dp)
                        .background(Color(0xFF0284C7).copy(alpha = 0.2f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(Icons.Default.Laptop, contentDescription = null, tint = Color(0xFF38BDF8))
                }
                Column {
                    Text(text = host.name, fontWeight = FontWeight.Bold, color = Color.White, fontSize = 15.sp)
                    Text(text = "${host.ip}:${host.port}", color = Color(0xFF94A3B8), fontSize = 12.sp)
                }
            }

            Button(
                onClick = onSelect,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
            ) {
                Text("Conectar")
            }
        }
    }
}
